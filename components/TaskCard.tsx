"use client";

import Link from "next/link";
import { Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Task {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  deadline: string;
  status: string;
  applicants: number;
}

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  // Use task._id if available; otherwise, fallback to task.id
  const taskId = task._id || task.id;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500 hover:bg-green-600">Open</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    // Wrapping the entire card in a single Link makes the card clickable.
    <Link href={`/task/${taskId}`} className="cursor-pointer">
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="line-clamp-1 text-lg">{task.title}</CardTitle>
            {getStatusBadge(task.status)}
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-muted-foreground line-clamp-2 text-sm mb-4">{task.description}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{task.budget}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>
                {task.deadline.split("-")[2]}/{task.deadline.split("-")[1]}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2 border-t">
          <Badge variant="outline">{task.category}</Badge>
          <div className="text-sm text-blue-600 hover:underline">View Details</div>
        </CardFooter>
      </Card>
    </Link>
  );
}
