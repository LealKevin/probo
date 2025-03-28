import {
  Suspense,
  useEffect,
  useState,
  useRef,
  DragEvent,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router";
import {
  graphql,
  PreloadedQuery,
  usePreloadedQuery,
  useQueryLoader,
  useMutation,
  fetchQuery,
  useRelayEnvironment,
} from "react-relay";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  FileIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  File as FileGeneric,
  FileText,
  Image,
  X,
  UserPlus,
  UserMinus,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";

import { Helmet } from "react-helmet-async";
import type { ControlOverviewPageQuery as ControlOverviewPageQueryType } from "./__generated__/ControlOverviewPageQuery.graphql";
import type { ControlOverviewPageUpdateTaskStateMutation as ControlOverviewPageUpdateTaskStateMutationType } from "./__generated__/ControlOverviewPageUpdateTaskStateMutation.graphql";
import type { ControlOverviewPageCreateTaskMutation as ControlOverviewPageCreateTaskMutationType } from "./__generated__/ControlOverviewPageCreateTaskMutation.graphql";
import type { ControlOverviewPageDeleteTaskMutation as ControlOverviewPageDeleteTaskMutationType } from "./__generated__/ControlOverviewPageDeleteTaskMutation.graphql";
import type { ControlOverviewPageUploadEvidenceMutation as ControlOverviewPageUploadEvidenceMutationType } from "./__generated__/ControlOverviewPageUploadEvidenceMutation.graphql";
import type { ControlOverviewPageDeleteEvidenceMutation as ControlOverviewPageDeleteEvidenceMutationType } from "./__generated__/ControlOverviewPageDeleteEvidenceMutation.graphql";
import type { ControlOverviewPageAssignTaskMutation as ControlOverviewPageAssignTaskMutationType } from "./__generated__/ControlOverviewPageAssignTaskMutation.graphql";
import type { ControlOverviewPageUnassignTaskMutation as ControlOverviewPageUnassignTaskMutationType } from "./__generated__/ControlOverviewPageUnassignTaskMutation.graphql";
import type { ControlOverviewPageOrganizationQuery$data } from "./__generated__/ControlOverviewPageOrganizationQuery.graphql";
import type { ControlOverviewPageUpdateControlStateMutation as ControlOverviewPageUpdateControlStateMutationType } from "./__generated__/ControlOverviewPageUpdateControlStateMutation.graphql";
import { Textarea } from "@/components/ui/textarea";

// Function to format ISO8601 duration to human-readable format
const formatDuration = (isoDuration: string): string => {
  if (!isoDuration || !isoDuration.startsWith("P")) {
    return isoDuration;
  }

  try {
    const durationRegex =
      /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/;
    const matches = isoDuration.match(durationRegex);

    if (!matches) return isoDuration;

    const years = matches[1] ? parseInt(matches[1]) : 0;
    const months = matches[2] ? parseInt(matches[2]) : 0;
    const days = matches[3] ? parseInt(matches[3]) : 0;
    const hours = matches[4] ? parseInt(matches[4]) : 0;
    const minutes = matches[5] ? parseInt(matches[5]) : 0;
    const seconds = matches[6] ? parseInt(matches[6]) : 0;

    const parts = [];
    if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
    if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    if (minutes)
      parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    if (seconds)
      parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);

    return parts.length > 0 ? parts.join(", ") : "No duration";
  } catch (error) {
    console.error("Error parsing duration:", error);
    return isoDuration;
  }
};

const controlOverviewPageQuery = graphql`
  query ControlOverviewPageQuery($controlId: ID!) {
    control: node(id: $controlId) {
      id
      ... on Control {
        name
        description
        state
        importance
        category
        version
        tasks(first: 100) @connection(key: "ControlOverviewPage_tasks") {
          __id
          edges {
            node {
              id
              name
              description
              state
              timeEstimate
              version
              assignedTo {
                id
                fullName
                primaryEmailAddress
              }
              evidences(first: 50)
                @connection(key: "ControlOverviewPage_evidences") {
                __id
                edges {
                  node {
                    id
                    mimeType
                    filename
                    size
                    state
                    createdAt
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const updateTaskStateMutation = graphql`
  mutation ControlOverviewPageUpdateTaskStateMutation(
    $input: UpdateTaskInput!
  ) {
    updateTask(input: $input) {
      task {
        id
        state
        version
      }
    }
  }
`;

const createTaskMutation = graphql`
  mutation ControlOverviewPageCreateTaskMutation(
    $input: CreateTaskInput!
    $connections: [ID!]!
  ) {
    createTask(input: $input) {
      taskEdge @prependEdge(connections: $connections) {
        node {
          id
          name
          description
          timeEstimate
          state
          version
          assignedTo {
            id
            fullName
            primaryEmailAddress
          }
        }
      }
    }
  }
`;

const deleteTaskMutation = graphql`
  mutation ControlOverviewPageDeleteTaskMutation(
    $input: DeleteTaskInput!
    $connections: [ID!]!
  ) {
    deleteTask(input: $input) {
      deletedTaskId @deleteEdge(connections: $connections)
    }
  }
`;

const uploadEvidenceMutation = graphql`
  mutation ControlOverviewPageUploadEvidenceMutation(
    $input: UploadEvidenceInput!
    $connections: [ID!]!
  ) {
    uploadEvidence(input: $input) {
      evidenceEdge @appendEdge(connections: $connections) {
        node {
          id
          filename
          fileUrl
          mimeType
          size
          state
          createdAt
        }
      }
    }
  }
`;

const deleteEvidenceMutation = graphql`
  mutation ControlOverviewPageDeleteEvidenceMutation(
    $input: DeleteEvidenceInput!
    $connections: [ID!]!
  ) {
    deleteEvidence(input: $input) {
      deletedEvidenceId @deleteEdge(connections: $connections)
    }
  }
`;

// Add a GraphQL query to fetch the fileUrl for an evidence item
const getEvidenceFileUrlQuery = graphql`
  query ControlOverviewPageGetEvidenceFileUrlQuery($evidenceId: ID!) {
    node(id: $evidenceId) {
      ... on Evidence {
        id
        fileUrl
      }
    }
  }
`;

const assignTaskMutation = graphql`
  mutation ControlOverviewPageAssignTaskMutation($input: AssignTaskInput!) {
    assignTask(input: $input) {
      task {
        id
        version
        assignedTo {
          id
          fullName
          primaryEmailAddress
        }
      }
    }
  }
`;

const unassignTaskMutation = graphql`
  mutation ControlOverviewPageUnassignTaskMutation($input: UnassignTaskInput!) {
    unassignTask(input: $input) {
      task {
        id
        version
        assignedTo {
          id
          fullName
          primaryEmailAddress
        }
      }
    }
  }
`;

const updateControlStateMutation = graphql`
  mutation ControlOverviewPageUpdateControlStateMutation(
    $input: UpdateControlInput!
  ) {
    updateControl(input: $input) {
      control {
        id
        state
        version
      }
    }
  }
`;

const organizationQuery = graphql`
  query ControlOverviewPageOrganizationQuery($organizationId: ID!) {
    organization: node(id: $organizationId) {
      id
      ... on Organization {
        peoples(first: 100, orderBy: { direction: ASC, field: FULL_NAME })
          @connection(key: "ControlOverviewPage_peoples") {
          edges {
            node {
              id
              fullName
              primaryEmailAddress
            }
          }
        }
      }
    }
  }
`;

function ControlOverviewPageContent({
  queryRef,
}: {
  queryRef: PreloadedQuery<ControlOverviewPageQueryType>;
}) {
  const data = usePreloadedQuery<ControlOverviewPageQueryType>(
    controlOverviewPageQuery,
    queryRef
  );
  const { toast } = useToast();
  const { organizationId, frameworkId, controlId } = useParams();
  const navigate = useNavigate();
  const environment = useRelayEnvironment();

  // Load organization data for people selector
  const [organizationData, setOrganizationData] =
    useState<ControlOverviewPageOrganizationQuery$data | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchQuery(environment, organizationQuery, {
        organizationId,
      })
        .toPromise()
        .then((response) => {
          setOrganizationData(
            response as ControlOverviewPageOrganizationQuery$data
          );
        })
        .catch((error) => {
          console.error("Error fetching organization data:", error);
          toast({
            title: "Error",
            description: "Failed to load people data",
            variant: "destructive",
          });
        });
    }
  }, [organizationId, environment, toast]);

  const formatImportance = (importance: string | undefined): string => {
    if (!importance) return "";

    const upperImportance = importance.toUpperCase();

    if (upperImportance === "MANDATORY") return "Mandatory";
    if (upperImportance === "PREFERRED") return "Preferred";
    if (upperImportance === "ADVANCED") return "Advanced";

    const formatted = importance.toLowerCase();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatState = (state: string | undefined): string => {
    if (!state) return "";

    const upperState = state.toUpperCase();

    if (upperState === "NOT_STARTED") return "Not Started";
    if (upperState === "IN_PROGRESS") return "In Progress";
    if (upperState === "NOT_APPLICABLE") return "Not Applicable";
    if (upperState === "IMPLEMENTED") return "Implemented";

    const formatted = state.toLowerCase();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getStateColor = (state: string | undefined): string => {
    if (!state) return "bg-gray-100 text-gray-800";

    const upperState = state.toUpperCase();

    if (upperState === "NOT_STARTED") return "bg-gray-100 text-gray-800";
    if (upperState === "IN_PROGRESS") return "bg-blue-100 text-blue-800";
    if (upperState === "NOT_APPLICABLE") return "bg-purple-100 text-purple-800";
    if (upperState === "IMPLEMENTED") return "bg-green-100 text-green-800";

    return "bg-gray-100 text-gray-800";
  };

  const getImportanceColor = (importance: string | undefined): string => {
    if (!importance) return "bg-gray-100 text-gray-800";

    const upperImportance = importance.toUpperCase();

    if (upperImportance === "MANDATORY") return "bg-red-100 text-red-800";
    if (upperImportance === "PREFERRED") return "bg-orange-100 text-orange-800";
    if (upperImportance === "ADVANCED") return "bg-blue-100 text-blue-800";

    return "bg-gray-100 text-gray-800";
  };

  const [updateTask] =
    useMutation<ControlOverviewPageUpdateTaskStateMutationType>(
      updateTaskStateMutation
    );
  const [createTask] =
    useMutation<ControlOverviewPageCreateTaskMutationType>(createTaskMutation);
  const [deleteTask] =
    useMutation<ControlOverviewPageDeleteTaskMutationType>(deleteTaskMutation);
  const [uploadEvidence] =
    useMutation<ControlOverviewPageUploadEvidenceMutationType>(
      uploadEvidenceMutation
    );
  const [deleteEvidence] =
    useMutation<ControlOverviewPageDeleteEvidenceMutationType>(
      deleteEvidenceMutation
    );
  const [assignTask] =
    useMutation<ControlOverviewPageAssignTaskMutationType>(assignTaskMutation);
  const [unassignTask] =
    useMutation<ControlOverviewPageUnassignTaskMutationType>(
      unassignTaskMutation
    );

  const [updateControlState] =
    useMutation<ControlOverviewPageUpdateControlStateMutationType>(
      updateControlStateMutation
    );

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [timeEstimateDays, setTimeEstimateDays] = useState("");
  const [timeEstimateHours, setTimeEstimateHours] = useState("");
  const [timeEstimateMinutes, setTimeEstimateMinutes] = useState("");

  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [taskForEvidence, setTaskForEvidence] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  const [draggedOverTaskId, setDraggedOverTaskId] = useState<string | null>(
    null
  );
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // State to track which task's evidence list is expanded
  const [expandedEvidenceTaskId, setExpandedEvidenceTaskId] = useState<
    string | null
  >(null);

  // Add state for the preview modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<{
    id: string;
    filename: string;
    mimeType: string;
    fileUrl?: string;
  } | null>(null);
  const [isLoadingFileUrl, setIsLoadingFileUrl] = useState(false);

  const [isDeleteEvidenceOpen, setIsDeleteEvidenceOpen] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState<{
    id: string;
    filename: string;
    taskId: string;
  } | null>(null);

  // Add state for people selector
  const [peoplePopoverOpen, setPeoplePopoverOpen] = useState<{
    [key: string]: boolean;
  }>({});

  // Add state for people search
  const [peopleSearch, setPeopleSearch] = useState<{
    [key: string]: string;
  }>({});

  const tasks = data.control.tasks?.edges.map((edge) => edge.node) || [];

  const getEvidenceConnectionId = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task?.evidences?.__id) {
        return task.evidences.__id;
      }
      return null;
    },
    [tasks]
  );

  // Function to convert days, hours, and minutes to ISO 8601 duration format
  const convertToISODuration = useCallback(() => {
    let duration = "P";

    if (timeEstimateDays && parseInt(timeEstimateDays) > 0) {
      duration += `${parseInt(timeEstimateDays)}D`;
    }

    if (
      (timeEstimateHours && parseInt(timeEstimateHours) > 0) ||
      (timeEstimateMinutes && parseInt(timeEstimateMinutes) > 0)
    ) {
      duration += "T";

      if (timeEstimateHours && parseInt(timeEstimateHours) > 0) {
        duration += `${parseInt(timeEstimateHours)}H`;
      }

      if (timeEstimateMinutes && parseInt(timeEstimateMinutes) > 0) {
        duration += `${parseInt(timeEstimateMinutes)}M`;
      }
    }

    // Return empty string if no time components were provided
    return duration === "P" ? "" : duration;
  }, [timeEstimateDays, timeEstimateHours, timeEstimateMinutes]);

  useEffect(() => {
    const handleDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDraggingFile(true);
      }
    };

    const handleDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      // Only set to false if we're leaving the window
      if (!e.relatedTarget || (e.relatedTarget as Node).nodeName === "HTML") {
        setIsDraggingFile(false);
      }
    };

    const handleDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleTaskClick = (
    taskId: string,
    currentState: string,
    version: number
  ) => {
    const newState = currentState === "DONE" ? "TODO" : "DONE";

    updateTask({
      variables: {
        input: {
          taskId,
          state: newState,
          expectedVersion: version,
        },
      },
      onCompleted: () => {
        toast({
          title: "Task updated",
          description: `Task has been ${
            newState === "DONE" ? "completed" : "reopened"
          }.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error updating task",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleCreateTask = () => {
    if (!newTaskName.trim()) {
      toast({
        title: "Error creating task",
        description: "Task name is required",
        variant: "destructive",
      });
      return;
    }

    if (!data.control.id) {
      toast({
        title: "Error creating task",
        description: "Control ID is missing",
        variant: "destructive",
      });
      return;
    }
    // Convert the time estimate components to ISO 8601 format
    const isoTimeEstimate = convertToISODuration();

    createTask({
      variables: {
        connections: [`${data.control.tasks?.__id}`],
        input: {
          controlId: data.control.id,
          name: newTaskName,
          description: newTaskDescription,
          timeEstimate: isoTimeEstimate === "" ? null : isoTimeEstimate,
        },
      },
      onCompleted: () => {
        toast({
          title: "Task created",
          description: "New task has been created successfully.",
        });
        setNewTaskName("");
        setNewTaskDescription("");
        setTimeEstimateDays("");
        setTimeEstimateHours("");
        setTimeEstimateMinutes("");
        setIsCreateTaskOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Error creating task",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleDeleteTask = (taskId: string, taskName: string) => {
    setTaskToDelete({ id: taskId, name: taskName });
    setIsDeleteTaskOpen(true);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;

    deleteTask({
      variables: {
        connections: [`${data.control.tasks?.__id}`],
        input: {
          taskId: taskToDelete.id,
        },
      },
      onCompleted: () => {
        toast({
          title: "Task deleted",
          description: "Task has been deleted successfully.",
        });
        setIsDeleteTaskOpen(false);
        setTaskToDelete(null);
      },
      onError: (error) => {
        toast({
          title: "Error deleting task",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleEditControl = () => {
    navigate(
      `/organizations/${organizationId}/frameworks/${frameworkId}/controls/${controlId}/update`
    );
  };

  const handleUploadEvidence = (taskId: string, taskName: string) => {
    setTaskForEvidence({ id: taskId, name: taskName });
    // Instead of opening a modal, directly trigger the file input click
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !taskForEvidence)
      return;

    const file = e.target.files[0];

    // Show toast for upload started
    toast({
      title: "Upload started",
      description: `Uploading ${file.name}...`,
      variant: "default",
    });

    // Get the evidence connection ID for this task
    const evidenceConnectionId = getEvidenceConnectionId(taskForEvidence.id);

    uploadEvidence({
      variables: {
        input: {
          taskId: taskForEvidence.id,
          name: file.name,
          file: null,
        },
        connections: evidenceConnectionId ? [evidenceConnectionId] : [],
      },
      uploadables: {
        "input.file": file,
      },
      onCompleted: () => {
        toast({
          title: "Evidence uploaded",
          description: "Evidence has been uploaded successfully.",
          variant: "default",
        });
        setTaskForEvidence(null);
        // Reset the file input
        if (hiddenFileInputRef.current) {
          hiddenFileInputRef.current.value = "";
        }
      },
      onError: (error) => {
        toast({
          title: "Error uploading evidence",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedOverTaskId !== taskId) {
      setDraggedOverTaskId(taskId);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverTaskId(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverTaskId(null);
    setIsDraggingFile(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    setUploadingTaskId(taskId);

    // Show toast for upload started
    toast({
      title: "Upload started",
      description: `Uploading ${file.name}...`,
      variant: "default",
    });

    // Get the evidence connection ID for this task
    const evidenceConnectionId = getEvidenceConnectionId(taskId);

    uploadEvidence({
      variables: {
        input: {
          taskId: taskId,
          name: file.name,
          file: null,
        },
        connections: evidenceConnectionId ? [evidenceConnectionId] : [],
      },
      uploadables: {
        "input.file": file,
      },
      onCompleted: () => {
        setUploadingTaskId(null);
        toast({
          title: "Evidence uploaded",
          description: "Evidence has been uploaded successfully.",
          variant: "default",
        });
      },
      onError: (error) => {
        setUploadingTaskId(null);
        toast({
          title: "Error uploading evidence",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to toggle evidence list expansion
  const toggleEvidenceList = (taskId: string) => {
    if (expandedEvidenceTaskId === taskId) {
      setExpandedEvidenceTaskId(null);
    } else {
      setExpandedEvidenceTaskId(taskId);
    }
  };

  // Function to get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="w-4 h-4 text-blue-500" />;
    } else if (mimeType.includes("pdf")) {
      return <FileText className="w-4 h-4 text-red-500" />;
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      return <FileText className="w-4 h-4 text-blue-600" />;
    } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      return <FileText className="w-4 h-4 text-green-600" />;
    } else {
      return <FileGeneric className="w-4 h-4 text-gray-500" />;
    }
  };

  // Simplified preview handler that opens the modal and sets the evidence
  const handlePreviewEvidence = (evidence: {
    id: string;
    filename: string;
    mimeType: string;
  }) => {
    setPreviewEvidence({
      id: evidence.id,
      filename: evidence.filename,
      mimeType: evidence.mimeType,
    });
    setIsPreviewModalOpen(true);
    setIsLoadingFileUrl(true);
    fetchQuery(environment, getEvidenceFileUrlQuery, {
      evidenceId: evidence.id,
    })
      .toPromise()
      .then((response) => {
        const data = response as { node?: { id: string; fileUrl?: string } };

        if (data?.node?.fileUrl) {
          setPreviewEvidence((prev) => {
            if (!prev) return null;
            return { ...prev, fileUrl: data.node!.fileUrl };
          });
        } else {
          throw new Error("File URL not available in response");
        }
      })
      .catch((error) => {
        console.error("Error fetching file URL:", error);
        toast({
          title: "Error fetching file URL",
          description: error.message || "Could not load the file preview",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoadingFileUrl(false);
      });
  };

  const handleDeleteEvidence = (
    evidenceId: string,
    filename: string,
    taskId: string
  ) => {
    setEvidenceToDelete({ id: evidenceId, filename, taskId });
    setIsDeleteEvidenceOpen(true);
  };

  const confirmDeleteEvidence = () => {
    if (!evidenceToDelete) return;

    const evidenceConnectionId = getEvidenceConnectionId(
      evidenceToDelete.taskId
    );

    deleteEvidence({
      variables: {
        input: {
          evidenceId: evidenceToDelete.id,
        },
        connections: evidenceConnectionId ? [evidenceConnectionId] : [],
      },
      onCompleted: () => {
        toast({
          title: "Evidence deleted",
          description: "Evidence has been deleted successfully.",
        });
        setIsDeleteEvidenceOpen(false);
        setEvidenceToDelete(null);
      },
      onError: (error) => {
        toast({
          title: "Error deleting evidence",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Function to handle assigning a person to a task
  const handleAssignPerson = (taskId: string, personId: string) => {
    assignTask({
      variables: {
        input: {
          taskId,
          assignedToId: personId,
        },
      },
      onCompleted: () => {
        toast({
          title: "Task assigned",
          description: "Task has been assigned successfully.",
        });
        // Close the popover
        setPeoplePopoverOpen((prev) => ({ ...prev, [taskId]: false }));
      },
      onError: (error) => {
        toast({
          title: "Error assigning task",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Function to handle unassigning a person from a task
  const handleUnassignPerson = (taskId: string) => {
    unassignTask({
      variables: {
        input: {
          taskId,
        },
      },
      onCompleted: () => {
        toast({
          title: "Task unassigned",
          description: "Task has been unassigned successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error unassigning task",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // Function to handle control state change
  const handleControlStateChange = (newState: string) => {
    updateControlState({
      variables: {
        input: {
          id: data.control.id,
          state: newState as
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "IMPLEMENTED"
            | "NOT_APPLICABLE",
          expectedVersion: data.control.version!,
        },
      },
      onCompleted: () => {
        toast({
          title: "Control state updated",
          description: `Control state has been updated to ${formatState(
            newState
          )}.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error updating control state",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      <Helmet>
        <title>{data.control.name || "Control"} - Probo</title>
      </Helmet>
      <div className="min-h-screen bg-white p-6 space-y-6">
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{data.control.name}</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEditControl}>
                Edit Control
              </Button>
              <Select
                defaultValue={data.control.state}
                onValueChange={handleControlStateChange}
              >
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <div
                    className={`${getStateColor(
                      data.control.state
                    )} px-2 py-0.5 rounded-full text-sm w-full text-center`}
                  >
                    {formatState(data.control.state)}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="IMPLEMENTED">Implemented</SelectItem>
                  <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
              <div
                className={`${getImportanceColor(
                  data.control.importance
                )} px-3 py-1 rounded-full text-sm`}
              >
                {formatImportance(data.control.importance)}
              </div>
            </div>
          </div>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="prose prose-gray prose-sm md:prose-base text-gray-600 max-w-3xl">
                <ReactMarkdown>{data.control.description}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 flex items-center bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                <FileIcon className="w-4 h-4 mr-2 text-blue-500" />
                <span>Drag & drop files onto tasks to upload evidence</span>
              </div>
              <Dialog
                open={isCreateTaskOpen}
                onOpenChange={setIsCreateTaskOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task to this control. Click save when
                      you&apos;re done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Task Name
                      </label>
                      <Input
                        id="name"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="Enter task name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Description (optional)
                      </label>
                      <Textarea
                        id="description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Enter task description"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="timeEstimate"
                        className="text-sm font-medium"
                      >
                        Time Estimate (optional)
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor="days"
                            className="text-xs text-gray-500 block mb-1"
                          >
                            Days
                          </label>
                          <Input
                            id="days"
                            type="number"
                            min="0"
                            value={timeEstimateDays}
                            onChange={(e) =>
                              setTimeEstimateDays(e.target.value)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="hours"
                            className="text-xs text-gray-500 block mb-1"
                          >
                            Hours
                          </label>
                          <Input
                            id="hours"
                            type="number"
                            min="0"
                            max="23"
                            value={timeEstimateHours}
                            onChange={(e) =>
                              setTimeEstimateHours(e.target.value)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="minutes"
                            className="text-xs text-gray-500 block mb-1"
                          >
                            Minutes
                          </label>
                          <Input
                            id="minutes"
                            type="number"
                            min="0"
                            max="59"
                            value={timeEstimateMinutes}
                            onChange={(e) =>
                              setTimeEstimateMinutes(e.target.value)
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateTaskOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTask}>Create Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className={`space-y-2 ${isDraggingFile ? "space-y-4" : ""}`}>
            {tasks.map((task) => (
              <div
                key={task?.id}
                className="rounded-md overflow-hidden border border-gray-200"
              >
                <div
                  className={`flex items-center gap-3 py-4 px-2 hover:bg-gray-50 group relative transition-all duration-200 ${
                    isDraggingFile && draggedOverTaskId !== task?.id
                      ? "border-dashed border-blue-300 bg-blue-50 bg-opacity-30"
                      : ""
                  } ${
                    draggedOverTaskId === task?.id
                      ? "bg-blue-50 border-2 border-blue-400 shadow-md"
                      : ""
                  }`}
                  onDragOver={(e) => task?.id && handleDragOver(e, task.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => task?.id && handleDrop(e, task.id)}
                >
                  {isDraggingFile && draggedOverTaskId !== task?.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md z-10">
                      <div className="flex items-center gap-2 text-blue-600 bg-white px-3 py-1.5 rounded-lg shadow-xs">
                        <FileIcon className="w-4 h-4" />
                        <p className="text-sm font-medium">Drop file here</p>
                      </div>
                    </div>
                  )}

                  {draggedOverTaskId === task?.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md z-10 bg-blue-50 bg-opacity-90 backdrop-blur-sm border-2 border-dashed border-blue-400">
                      <div className="flex items-center gap-2 text-blue-600 bg-white p-5 rounded-lg shadow-md">
                        <Upload className="w-4 h-4 text-blue-500" />
                        <p className="text-sm font-medium text-center">
                          Drop file to upload evidence
                        </p>
                      </div>
                    </div>
                  )}

                  {uploadingTaskId === task?.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 rounded-md z-10 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3 text-blue-600">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <p className="font-medium">Uploading evidence...</p>
                        <p className="text-sm text-gray-500">Please wait</p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${
                      task?.state === "DONE"
                        ? "border-gray-400 bg-gray-100"
                        : "border-gray-300"
                    } ${isDraggingFile ? "opacity-50" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (task?.id && task?.state) {
                        handleTaskClick(task.id, task.state, task.version);
                      }
                    }}
                  >
                    {task?.state === "DONE" && (
                      <CheckCircle2 className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div
                    className={`flex-1 flex items-center justify-between ${
                      isDraggingFile ? "opacity-50" : ""
                    }`}
                  >
                    <div>
                      <h3
                        className={`text-sm ${
                          task?.state === "DONE"
                            ? "text-gray-500 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task?.name}
                      </h3>
                      {task?.timeEstimate && (
                        <p
                          className={`text-xs mt-1 flex items-center ${
                            task?.state === "DONE"
                              ? "text-gray-400 line-through"
                              : "text-blue-500"
                          }`}
                        >
                          <span className="inline-block w-4 h-4 mr-1">⏱️</span>
                          <span>{formatDuration(task.timeEstimate)}</span>
                        </p>
                      )}
                      {task?.assignedTo && (
                        <p className="text-xs mt-1 flex items-center text-gray-600">
                          <User className="w-3 h-3 mr-1" />
                          <span>{task.assignedTo.fullName}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* People Selector */}
                      <Popover
                        open={peoplePopoverOpen[task?.id || ""]}
                        onOpenChange={(open: boolean) => {
                          if (task?.id) {
                            setPeoplePopoverOpen((prev) => ({
                              ...prev,
                              [task.id]: open,
                            }));
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (task?.id) {
                                setPeoplePopoverOpen((prev) => ({
                                  ...prev,
                                  [task.id]: !prev[task.id],
                                }));
                              }
                            }}
                          >
                            {task?.assignedTo ? (
                              <UserMinus className="w-4 h-4" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0" align="end">
                          {task?.assignedTo ? (
                            <div className="p-4 space-y-4">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <div className="text-sm">
                                  <p className="font-medium">
                                    {task.assignedTo.fullName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {task.assignedTo.primaryEmailAddress}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task?.id) {
                                    handleUnassignPerson(task.id);
                                  }
                                }}
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Unassign
                              </Button>
                            </div>
                          ) : (
                            <div className="max-h-[300px] overflow-y-auto">
                              <div className="p-2 border-b">
                                <input
                                  type="text"
                                  placeholder="Search people to assign..."
                                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  value={peopleSearch[task?.id || ""] || ""}
                                  onChange={(e) => {
                                    if (task?.id) {
                                      setPeopleSearch((prev) => ({
                                        ...prev,
                                        [task.id]: e.target.value,
                                      }));
                                    }
                                  }}
                                />
                              </div>
                              <div className="px-3 py-2 text-xs text-gray-500">
                                Click on a person to assign them to this task
                              </div>
                              <div className="py-1">
                                {!organizationData?.organization?.peoples?.edges?.some(
                                  (edge) => {
                                    if (!edge?.node) return false;
                                    const searchTerm = (
                                      peopleSearch[task?.id || ""] || ""
                                    ).toLowerCase();
                                    return (
                                      !searchTerm ||
                                      edge.node.fullName
                                        .toLowerCase()
                                        .includes(searchTerm) ||
                                      edge.node.primaryEmailAddress
                                        .toLowerCase()
                                        .includes(searchTerm)
                                    );
                                  }
                                ) && (
                                  <div className="py-6 text-center text-sm">
                                    No people found.
                                  </div>
                                )}
                                {organizationData?.organization?.peoples?.edges?.map(
                                  (edge) => {
                                    if (!edge?.node) return null;

                                    const searchTerm = (
                                      peopleSearch[task?.id || ""] || ""
                                    ).toLowerCase();
                                    if (
                                      searchTerm &&
                                      !edge.node.fullName
                                        .toLowerCase()
                                        .includes(searchTerm) &&
                                      !edge.node.primaryEmailAddress
                                        .toLowerCase()
                                        .includes(searchTerm)
                                    ) {
                                      return null;
                                    }

                                    return (
                                      <div
                                        key={edge.node.id}
                                        className="px-2 py-1 hover:bg-blue-50 cursor-pointer"
                                      >
                                        <button
                                          type="button"
                                          className="flex items-center w-full text-left"
                                          onClick={() => {
                                            if (task?.id) {
                                              handleAssignPerson(
                                                task.id,
                                                edge.node.id
                                              );
                                              setPeoplePopoverOpen((prev) => ({
                                                ...prev,
                                                [task.id]: false,
                                              }));
                                            }
                                          }}
                                        >
                                          <User className="mr-2 h-4 w-4 text-blue-500 flex-shrink-0" />
                                          <div>
                                            <p className="font-medium">
                                              {edge.node.fullName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {edge.node.primaryEmailAddress}
                                            </p>
                                          </div>
                                        </button>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>

                      <button
                        type="button"
                        className="text-gray-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (task?.id && task?.name) {
                            handleUploadEvidence(task.id, task.name);
                          }
                        }}
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (task?.id && task?.name) {
                            handleDeleteTask(task.id, task.name);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Evidence section */}
                {task?.evidences?.edges && task.evidences.edges.length > 0 && (
                  <>
                    <div
                      className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => task.id && toggleEvidenceList(task.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {task.evidences.edges.length}{" "}
                          {task.evidences.edges.length === 1
                            ? "Evidence"
                            : "Evidences"}
                        </span>
                      </div>
                      {expandedEvidenceTaskId === task.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>

                    {expandedEvidenceTaskId === task.id && (
                      <div className="bg-white border-t border-gray-200 p-3 space-y-2.5">
                        {task.evidences.edges.map((edge) => {
                          if (!edge) return null;
                          const evidence = edge.node;
                          if (!evidence) return null;

                          return (
                            <div
                              key={evidence.id}
                              className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-md border border-gray-200">
                                  {getFileIcon(evidence.mimeType)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-800">
                                    {evidence.filename}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                    <span className="font-medium text-gray-600">
                                      {formatFileSize(evidence.size)}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {formatDate(evidence.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {evidence.mimeType.startsWith("image/") ? (
                                  <button
                                    onClick={() =>
                                      handlePreviewEvidence(evidence)
                                    }
                                    className="p-1.5 rounded-full hover:bg-white hover:shadow-sm transition-all"
                                    title="Preview Image"
                                  >
                                    <Eye className="w-4 h-4 text-blue-600" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePreviewEvidence(evidence);
                                    }}
                                    className="p-1.5 rounded-full hover:bg-white hover:shadow-sm transition-all"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4 text-blue-600" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePreviewEvidence(evidence);
                                  }}
                                  className="p-1.5 rounded-full hover:bg-white hover:shadow-sm transition-all"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (task?.id) {
                                      handleDeleteEvidence(
                                        evidence.id,
                                        evidence.filename,
                                        task.id
                                      );
                                    }
                                  }}
                                  className="p-1.5 rounded-full hover:bg-red-50 hover:shadow-sm transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks yet. Click &quot;Add Task&quot; to create one.</p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input for direct uploads */}
        <input
          type="file"
          ref={hiddenFileInputRef}
          onChange={handleFileSelected}
          style={{ display: "none" }}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        {/* Delete Task Confirmation Dialog */}
        <Dialog open={isDeleteTaskOpen} onOpenChange={setIsDeleteTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the task &quot;
                {taskToDelete?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteTaskOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteTask}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add the Preview Modal */}
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{previewEvidence?.filename}</span>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </DialogTitle>
              <DialogDescription>
                Preview of the evidence file. You can view or download the file
                from here.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 rounded-md p-4">
              {isLoadingFileUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-gray-500">Loading preview...</p>
                </div>
              ) : previewEvidence?.fileUrl ? (
                previewEvidence.mimeType.startsWith("image/") ? (
                  <img
                    src={previewEvidence.fileUrl}
                    alt={previewEvidence.filename}
                    className="max-h-[70vh] object-contain"
                  />
                ) : previewEvidence.mimeType.includes("pdf") ? (
                  <iframe
                    src={previewEvidence.fileUrl}
                    className="w-full h-[70vh]"
                    title={previewEvidence.filename}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <FileGeneric className="w-16 h-16 text-gray-400" />
                    <p className="text-gray-600">
                      Preview not available for this file type
                    </p>
                    <Button
                      onClick={() => {
                        if (previewEvidence?.fileUrl) {
                          window.open(previewEvidence.fileUrl, "_blank");
                        }
                      }}
                    >
                      Download File
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileGeneric className="w-12 h-12 text-gray-400" />
                  <p className="text-gray-500">Failed to load preview</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Close
              </Button>
              {previewEvidence?.fileUrl && (
                <Button
                  onClick={() => {
                    if (previewEvidence?.fileUrl) {
                      window.open(previewEvidence.fileUrl, "_blank");
                    }
                  }}
                >
                  Download
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Delete Evidence Confirmation Dialog */}
        <Dialog
          open={isDeleteEvidenceOpen}
          onOpenChange={setIsDeleteEvidenceOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Evidence</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the evidence &quot;
                {evidenceToDelete?.filename}&quot;? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteEvidenceOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteEvidence}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function ControlOverviewPageFallback() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-96 bg-gray-100 animate-pulse rounded mt-2" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-6 w-48 bg-gray-100 animate-pulse rounded mb-2" />
              <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ControlOverviewPage() {
  const { controlId } = useParams();
  const [queryRef, loadQuery] = useQueryLoader<ControlOverviewPageQueryType>(
    controlOverviewPageQuery
  );

  useEffect(() => {
    if (controlId) {
      loadQuery({ controlId });
    }
  }, [controlId, loadQuery]);

  if (!queryRef) {
    return <ControlOverviewPageFallback />;
  }

  return (
    <Suspense fallback={<ControlOverviewPageFallback />}>
      <ControlOverviewPageContent queryRef={queryRef} />
    </Suspense>
  );
}
