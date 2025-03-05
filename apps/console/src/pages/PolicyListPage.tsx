import { Suspense, useEffect, useState } from "react";
import {
  graphql,
  PreloadedQuery,
  usePreloadedQuery,
  useQueryLoader,
} from "react-relay";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  Search,
  Clock,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { PolicyListPageQuery as PolicyListPageQueryType } from "./__generated__/PolicyListPageQuery.graphql";

const PolicyListPageQuery = graphql`
  query PolicyListPageQuery($organizationId: ID!) {
    organization: node(id: $organizationId) {
      ... on Organization {
        policies(first: 25) @connection(key: "PolicyListPage_policies") {
          edges {
            node {
              id
              name
              content
              createdAt
              updatedAt
              status
            }
          }
        }
      }
    }
  }
`;

function PolicyCard({
  title,
  content,
  status,
  updatedAt,
}: {
  title: string;
  content?: string;
  status?: string;
  updatedAt: string;
}) {
  const formattedUpdatedAt = new Date(updatedAt);

  // Extract a short description from the content and strip HTML tags
  const stripHtmlTags = (html: string) => {
    // First remove HTML tags
    const withoutTags = html.replace(/<[^>]*>/g, "");
    // Then decode HTML entities
    const decoded = withoutTags
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, " ");
    // Remove markdown headers
    return decoded.replace(/#.*?\n/, "").trim();
  };

  const description = content
    ? stripHtmlTags(content).substring(0, 120) +
      (content.length > 120 ? "..." : "")
    : "No description available";

  return (
    <Card className="relative overflow-hidden border bg-card transition-all hover:shadow-md h-full flex flex-col">
      <CardContent className="p-6 flex-grow">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-xl">{title}</h3>
            {status && (
              <Badge
                className={`${
                  status === "ACTIVE"
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "ACTIVE"
                  ? "Security"
                  : status === "DRAFT"
                  ? "Draft"
                  : status}
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {description}
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
            <Clock className="h-4 w-4" />
            <span>
              Last updated: {format(formattedUpdatedAt, "yyyy-MM-dd")}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-0 border-t">
        <div className="w-full grid grid-cols-2">
          <Button variant="ghost" className="rounded-none h-12 border-r">
            <FileText className="h-5 w-5 mr-2" />
            View Policy
          </Button>
          <Button variant="ghost" className="rounded-none h-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function PolicyListPageContent({
  queryRef,
}: {
  queryRef: PreloadedQuery<PolicyListPageQueryType>;
}) {
  const data = usePreloadedQuery<PolicyListPageQueryType>(
    PolicyListPageQuery,
    queryRef
  );
  const { organizationId } = useParams();
  const policies =
    data.organization.policies?.edges.map((edge) => edge?.node) ?? [];

  // State for search, filtering and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name-asc");

  // Filter and sort policies
  const filteredPolicies = policies
    .filter((policy) => {
      // Filter by search query
      const matchesSearch = policy.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter by status
      const matchesStatus =
        statusFilter === "ALL" || policy.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort policies
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "updated-desc":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "updated-asc":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        case "created-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "created-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  return (
    <>
      <Helmet>
        <title>Policies - Probo</title>
      </Helmet>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Policies</h1>
            <p className="text-muted-foreground">
              Manage your organization{"'"}s policies
            </p>
          </div>
          <Button asChild>
            <Link to={`/organizations/${organizationId}/policies/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Policy
            </Link>
          </Button>
        </div>

        {/* Search and filter controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("name-asc")}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name-desc")}>
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("updated-desc")}>
                  Recently Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("updated-asc")}>
                  Oldest Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created-desc")}>
                  Recently Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("created-asc")}>
                  Oldest Created
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredPolicies.length} of {policies.length} policies
        </div>

        {/* Policy grid */}
        <div className="space-y-6">
          {filteredPolicies.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPolicies.map((policy) => (
                <Link
                  key={policy.id}
                  to={`/organizations/${organizationId}/policies/${policy.id}`}
                  className="group"
                >
                  <PolicyCard
                    title={policy.name}
                    content={policy.content}
                    status={policy.status}
                    updatedAt={policy.updatedAt}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No policies found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Create your first policy to get started"}
              </p>
              {searchQuery || statusFilter !== "ALL" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button asChild>
                  <Link to={`/organizations/${organizationId}/policies/create`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Policy
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PolicyListPageFallback() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded mt-1" />
        </div>
        <div className="h-10 w-36 bg-muted animate-pulse rounded" />
      </div>

      {/* Search and filter controls skeleton */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 h-10 bg-muted animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-[180px] bg-muted animate-pulse rounded" />
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Results summary skeleton */}
      <div className="mb-4 h-4 w-48 bg-muted animate-pulse rounded" />

      {/* Policy grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-card/50 h-full flex flex-col">
            <CardContent className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-3">
                <div className="h-7 w-48 bg-muted animate-pulse rounded" />
                <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </div>
              <div className="mt-auto space-y-2">
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
            <CardFooter className="p-0 border-t">
              <div className="w-full grid grid-cols-2">
                <div className="h-12 border-r bg-muted/20 animate-pulse" />
                <div className="h-12 bg-muted/20 animate-pulse" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PolicyListPage() {
  const [queryRef, loadQuery] =
    useQueryLoader<PolicyListPageQueryType>(PolicyListPageQuery);

  const { organizationId } = useParams();

  useEffect(() => {
    loadQuery({ organizationId: organizationId! });
  }, [loadQuery, organizationId]);

  return (
    <>
      <Helmet>
        <title>Policies - Probo Console</title>
      </Helmet>
      <Suspense fallback={<PolicyListPageFallback />}>
        {queryRef && <PolicyListPageContent queryRef={queryRef} />}
      </Suspense>
    </>
  );
}
