// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package types

import (
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/getprobo/probo/pkg/gid"
	"github.com/getprobo/probo/pkg/page"
)

type Node interface {
	IsNode()
	GetID() gid.GID
}

type Control struct {
	ID               gid.GID                           `json:"id"`
	Name             string                            `json:"name"`
	Description      string                            `json:"description"`
	State            ControlState                      `json:"state"`
	StateTransisions *ControlStateTransitionConnection `json:"stateTransisions"`
	Tasks            *TaskConnection                   `json:"tasks"`
	CreatedAt        time.Time                         `json:"createdAt"`
	UpdatedAt        time.Time                         `json:"updatedAt"`
}

func (Control) IsNode()             {}
func (this Control) GetID() gid.GID { return this.ID }

type ControlConnection struct {
	Edges    []*ControlEdge `json:"edges"`
	PageInfo *PageInfo      `json:"pageInfo"`
}

type ControlEdge struct {
	Cursor page.CursorKey `json:"cursor"`
	Node   *Control       `json:"node"`
}

type ControlStateTransition struct {
	ID        gid.GID       `json:"id"`
	FromState *ControlState `json:"fromState,omitempty"`
	ToState   ControlState  `json:"toState"`
	Reason    *string       `json:"reason,omitempty"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
}

type ControlStateTransitionConnection struct {
	Edges    []*ControlStateTransitionEdge `json:"edges"`
	PageInfo *PageInfo                     `json:"pageInfo"`
}

type ControlStateTransitionEdge struct {
	Cursor page.CursorKey          `json:"cursor"`
	Node   *ControlStateTransition `json:"node"`
}

type CreateVendorInput struct {
	OrganizationID gid.GID `json:"organizationId"`
	Name           string  `json:"name"`
}

type Evidence struct {
	ID               gid.GID                            `json:"id"`
	FileURL          string                             `json:"fileUrl"`
	MimeType         string                             `json:"mimeType"`
	Size             int                                `json:"size"`
	State            EvidenceState                      `json:"state"`
	StateTransisions *EvidenceStateTransitionConnection `json:"stateTransisions"`
	CreatedAt        time.Time                          `json:"createdAt"`
	UpdatedAt        time.Time                          `json:"updatedAt"`
}

func (Evidence) IsNode()             {}
func (this Evidence) GetID() gid.GID { return this.ID }

type EvidenceConnection struct {
	Edges    []*EvidenceEdge `json:"edges"`
	PageInfo *PageInfo       `json:"pageInfo"`
}

type EvidenceEdge struct {
	Cursor page.CursorKey `json:"cursor"`
	Node   *Evidence      `json:"node"`
}

type EvidenceStateTransition struct {
	ID        gid.GID        `json:"id"`
	FromState *EvidenceState `json:"fromState,omitempty"`
	ToState   EvidenceState  `json:"toState"`
	Reason    *string        `json:"reason,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
}

type EvidenceStateTransitionConnection struct {
	Edges    []*EvidenceStateTransitionEdge `json:"edges"`
	PageInfo *PageInfo                      `json:"pageInfo"`
}

type EvidenceStateTransitionEdge struct {
	Cursor page.CursorKey           `json:"cursor"`
	Node   *EvidenceStateTransition `json:"node"`
}

type Framework struct {
	ID          gid.GID            `json:"id"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	Controls    *ControlConnection `json:"controls"`
	CreatedAt   time.Time          `json:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt"`
}

func (Framework) IsNode()             {}
func (this Framework) GetID() gid.GID { return this.ID }

type FrameworkConnection struct {
	Edges    []*FrameworkEdge `json:"edges"`
	PageInfo *PageInfo        `json:"pageInfo"`
}

type FrameworkEdge struct {
	Cursor page.CursorKey `json:"cursor"`
	Node   *Framework     `json:"node"`
}

type Mutation struct {
}

type Organization struct {
	ID         gid.GID              `json:"id"`
	Name       string               `json:"name"`
	LogoURL    string               `json:"logoUrl"`
	Frameworks *FrameworkConnection `json:"frameworks"`
	Vendors    *VendorConnection    `json:"vendors"`
	Peoples    *PeopleConnection    `json:"peoples"`
	CreatedAt  time.Time            `json:"createdAt"`
	UpdatedAt  time.Time            `json:"updatedAt"`
}

func (Organization) IsNode()             {}
func (this Organization) GetID() gid.GID { return this.ID }

type PageInfo struct {
	HasNextPage     bool            `json:"hasNextPage"`
	HasPreviousPage bool            `json:"hasPreviousPage"`
	StartCursor     *page.CursorKey `json:"startCursor,omitempty"`
	EndCursor       *page.CursorKey `json:"endCursor,omitempty"`
}

type People struct {
	ID                       gid.GID   `json:"id"`
	FullName                 string    `json:"fullName"`
	PrimaryEmailAddress      string    `json:"primaryEmailAddress"`
	AdditionalEmailAddresses []string  `json:"additionalEmailAddresses"`
	CreatedAt                time.Time `json:"createdAt"`
	UpdatedAt                time.Time `json:"updatedAt"`
}

func (People) IsNode()             {}
func (this People) GetID() gid.GID { return this.ID }

type PeopleConnection struct {
	Edges    []*PeopleEdge `json:"edges"`
	PageInfo *PageInfo     `json:"pageInfo"`
}

type PeopleEdge struct {
	Cursor page.CursorKey `json:"cursor"`
	Node   *People        `json:"node"`
}

type Query struct {
}

type Task struct {
	ID               gid.GID                        `json:"id"`
	Name             string                         `json:"name"`
	Description      string                         `json:"description"`
	State            TaskState                      `json:"state"`
	StateTransisions *TaskStateTransitionConnection `json:"stateTransisions"`
	Evidences        *EvidenceConnection            `json:"evidences"`
	CreatedAt        time.Time                      `json:"createdAt"`
	UpdatedAt        time.Time                      `json:"updatedAt"`
}

func (Task) IsNode()             {}
func (this Task) GetID() gid.GID { return this.ID }

type TaskConnection struct {
	Edges    []*TaskEdge `json:"edges"`
	PageInfo *PageInfo   `json:"pageInfo"`
}

type TaskEdge struct {
	Cursor page.CursorKey `json:"cursor"`
	Node   *Task          `json:"node"`
}

type TaskStateTransition struct {
	ID        gid.GID    `json:"id"`
	FromState *TaskState `json:"fromState,omitempty"`
	ToState   TaskState  `json:"toState"`
	Reason    *string    `json:"reason,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

type TaskStateTransitionConnection struct {
	Edges    []*TaskStateTransitionEdge `json:"edges"`
	PageInfo *PageInfo                  `json:"pageInfo"`
}

type TaskStateTransitionEdge struct {
	Cursor page.CursorKey       `json:"cursor"`
	Node   *TaskStateTransition `json:"node"`
}

type Vendor struct {
	ID        gid.GID   `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (Vendor) IsNode()             {}
func (this Vendor) GetID() gid.GID { return this.ID }

type VendorConnection struct {
	Edges    []*VendorEdge `json:"edges"`
	PageInfo *PageInfo     `json:"pageInfo"`
}

type VendorEdge struct {
	Cursor page.CursorKey `json:"cursor"`
	Node   *Vendor        `json:"node"`
}

type ControlState string

const (
	ControlStateNotStarted    ControlState = "NOT_STARTED"
	ControlStateInProgress    ControlState = "IN_PROGRESS"
	ControlStateNotApplicable ControlState = "NOT_APPLICABLE"
	ControlStateImplemented   ControlState = "IMPLEMENTED"
)

var AllControlState = []ControlState{
	ControlStateNotStarted,
	ControlStateInProgress,
	ControlStateNotApplicable,
	ControlStateImplemented,
}

func (e ControlState) IsValid() bool {
	switch e {
	case ControlStateNotStarted, ControlStateInProgress, ControlStateNotApplicable, ControlStateImplemented:
		return true
	}
	return false
}

func (e ControlState) String() string {
	return string(e)
}

func (e *ControlState) UnmarshalGQL(v any) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = ControlState(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid ControlState", str)
	}
	return nil
}

func (e ControlState) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type EvidenceState string

const (
	EvidenceStateValid   EvidenceState = "VALID"
	EvidenceStateInvalid EvidenceState = "INVALID"
	EvidenceStateExpired EvidenceState = "EXPIRED"
)

var AllEvidenceState = []EvidenceState{
	EvidenceStateValid,
	EvidenceStateInvalid,
	EvidenceStateExpired,
}

func (e EvidenceState) IsValid() bool {
	switch e {
	case EvidenceStateValid, EvidenceStateInvalid, EvidenceStateExpired:
		return true
	}
	return false
}

func (e EvidenceState) String() string {
	return string(e)
}

func (e *EvidenceState) UnmarshalGQL(v any) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = EvidenceState(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid EvidenceState", str)
	}
	return nil
}

func (e EvidenceState) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type TaskState string

const (
	TaskStateTodo TaskState = "TODO"
	TaskStateDone TaskState = "DONE"
)

var AllTaskState = []TaskState{
	TaskStateTodo,
	TaskStateDone,
}

func (e TaskState) IsValid() bool {
	switch e {
	case TaskStateTodo, TaskStateDone:
		return true
	}
	return false
}

func (e TaskState) String() string {
	return string(e)
}

func (e *TaskState) UnmarshalGQL(v any) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = TaskState(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid TaskState", str)
	}
	return nil
}

func (e TaskState) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}
