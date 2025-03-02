// Copyright (c) 2025 Probo Inc <hello@getprobo.com>.
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.

package coredata

import (
	"context"
	"fmt"
	"maps"
	"time"

	"github.com/getprobo/probo/pkg/gid"
	"github.com/getprobo/probo/pkg/page"
	"github.com/jackc/pgx/v5"

	"go.gearno.de/kit/pg"
)

type (
	Task struct {
		ID          gid.GID   `db:"id"`
		ControlID   gid.GID   `db:"control_id"`
		Name        string    `db:"name"`
		Description string    `db:"description"`
		State       TaskState `db:"state"`
		ContentRef  string    `db:"content_ref"`
		CreatedAt   time.Time `db:"created_at"`
		UpdatedAt   time.Time `db:"updated_at"`
	}

	Tasks []*Task
)

func (t Task) CursorKey() page.CursorKey {
	return page.NewCursorKey(t.ID, t.CreatedAt)
}

func (t *Task) LoadByID(
	ctx context.Context,
	conn pg.Conn,
	scope *Scope,
	taskID gid.GID,
) error {
	q := `
WITH
    control_tasks AS (
        SELECT
            t.id,
            ct.control_id AS control_id,
            t.name,
            t.description,
            t.content_ref,
            t.created_at,
            t.updated_at
         FROM
             tasks t
         INNER JOIN
             controls_tasks ct ON
                 ct.task_id = t.id
         WHERE
             %s
             AND id = @task_id
    ),
    task_states AS (
        SELECT
            task_id,
            to_state AS state,
            reason,
            RANK() OVER w
        FROM
            task_state_transitions
        WHERE
            task_id = @task_id
        WINDOW
            w AS (PARTITION BY task_id ORDER BY created_at DESC)
    )
SELECT
    id,
    control_id,
    name,
    description,
    ts.state AS state,
    content_ref,
    created_at,
    updated_at
FROM
    control_tasks
INNER JOIN
    task_states ts ON ts.task_id = control_tasks.id
WHERE
    ts.rank = 1
    AND id = @task_id
LIMIT 1;
`

	q = fmt.Sprintf(q, scope.SQLFragment())

	args := pgx.StrictNamedArgs{"task_id": taskID}
	maps.Copy(args, scope.SQLArguments())

	rows, err := conn.Query(ctx, q, args)
	if err != nil {
		return fmt.Errorf("cannot query task: %w", err)
	}

	task, err := pgx.CollectExactlyOneRow(rows, pgx.RowToStructByName[Task])
	if err != nil {
		return fmt.Errorf("cannot collect task: %w", err)
	}

	*t = task

	return nil
}

func (t Task) Insert(
	ctx context.Context,
	conn pg.Conn,
) error {
	q := `
WITH task_insert AS (
   INSERT INTO tasks (
       id,
       name,
       description,
       content_ref,
       created_at,
       updated_at
   )
   VALUES (
       @task_id,
       @name,
       @description,
       @content_ref,
       @created_at,
       @updated_at
   )
   RETURNING id
)
INSERT INTO controls_tasks (
   task_id,
   control_id,
   created_at
)
VALUES (
   (SELECT id FROM task_insert),
   @control_id,
   @created_at
);
`

	args := pgx.StrictNamedArgs{
		"task_id":     t.ID,
		"control_id":  t.ControlID,
		"name":        t.Name,
		"description": t.Description,
		"content_ref": t.ContentRef,
		"created_at":  t.CreatedAt,
		"updated_at":  t.UpdatedAt,
	}
	_, err := conn.Exec(ctx, q, args)
	return err
}

func (t *Tasks) LoadByControlID(
	ctx context.Context,
	conn pg.Conn,
	scope *Scope,
	controlID gid.GID,
	cursor *page.Cursor,
) error {
	q := `
WITH
    control_tasks AS (
        SELECT
            t.id,
            @control_id AS control_id,
            t.name,
            t.description,
            t.content_ref,
            t.created_at,
            t.updated_at
         FROM
             tasks t
         INNER JOIN
             controls_tasks ct ON
                 ct.task_id = t.id
                 AND ct.control_id = @control_id
         WHERE
             %s
    ),
    task_states AS (
        SELECT
            task_id,
            to_state AS state,
            reason,
            RANK() OVER w
        FROM
            task_state_transitions
        WINDOW
            w AS (PARTITION BY task_id ORDER BY created_at DESC)
    )
SELECT
    id,
    control_id,
    name,
    description,
    ts.state AS state,
    content_ref,
    created_at,
    updated_at
FROM
    control_tasks
INNER JOIN
    task_states ts ON ts.task_id = control_tasks.id
WHERE
    ts.rank = 1
    AND %s
`

	q = fmt.Sprintf(q, scope.SQLFragment(), cursor.SQLFragment())

	args := pgx.StrictNamedArgs{"control_id": controlID}
	maps.Copy(args, scope.SQLArguments())
	maps.Copy(args, cursor.SQLArguments())

	rows, err := conn.Query(ctx, q, args)
	if err != nil {
		return fmt.Errorf("cannot query tasks: %w", err)
	}

	tasks, err := pgx.CollectRows(rows, pgx.RowToAddrOfStructByName[Task])
	if err != nil {
		return fmt.Errorf("cannot collect tasks: %w", err)
	}

	*t = tasks

	return nil
}

func (t *Task) Delete(
	ctx context.Context,
	conn pg.Conn,
	scope *Scope,
) error {
	q := `
WITH control_count AS (
    SELECT COUNT(*) AS count FROM controls_tasks WHERE task_id = @task_id
),
delete_link AS (
    DELETE FROM controls_tasks 
    WHERE task_id = @task_id AND control_id = @control_id
    RETURNING task_id
),
delete_transitions AS (
    DELETE FROM task_state_transitions 
    WHERE %s AND task_id = @task_id AND (SELECT count FROM control_count) <= 1
    RETURNING task_id
),
delete_all_links AS (
    DELETE FROM controls_tasks 
    WHERE task_id = @task_id AND (SELECT count FROM control_count) <= 1
    RETURNING task_id
),
delete_task AS (
    DELETE FROM tasks 
    WHERE %s AND id = @task_id AND (SELECT count FROM control_count) <= 1
    RETURNING id
)
SELECT 
    (SELECT count FROM control_count) AS control_count,
    (SELECT COUNT(*) FROM delete_link) AS deleted_links,
    (SELECT COUNT(*) FROM delete_transitions) AS deleted_transitions,
    (SELECT COUNT(*) FROM delete_all_links) AS deleted_all_links,
    (SELECT COUNT(*) FROM delete_task) AS deleted_tasks;
`
	q = fmt.Sprintf(q, scope.SQLFragment(), scope.SQLFragment())

	args := pgx.StrictNamedArgs{
		"task_id":    t.ID,
		"control_id": t.ControlID,
	}
	maps.Copy(args, scope.SQLArguments())

	var controlCount, deletedLinks, deletedTransitions, deletedAllLinks, deletedTasks int
	err := conn.QueryRow(ctx, q, args).Scan(
		&controlCount,
		&deletedLinks,
		&deletedTransitions,
		&deletedAllLinks,
		&deletedTasks,
	)

	if err != nil {
		return fmt.Errorf("cannot execute delete operation: %w", err)
	}

	if controlCount <= 1 {
		if deletedTransitions == 0 || deletedAllLinks == 0 || deletedTasks == 0 {
			return fmt.Errorf("failed to delete task completely: transitions=%d, links=%d, tasks=%d",
				deletedTransitions, deletedAllLinks, deletedTasks)
		}
	} else {
		if deletedLinks == 0 {
			return fmt.Errorf("failed to delete control-task link")
		}
	}

	return nil
}
