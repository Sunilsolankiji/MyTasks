import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskListSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                    <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-8 w-8" />
            </CardHeader>
            <CardContent>
                <div className="pl-9">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <div className="flex justify-between items-center pt-4">
                        <div/>
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}
