"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function EditTaskPage() {
  const router = useRouter();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTask() {
      setIsLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const task = response.data;
        setTitle(task.title);
        setDescription(task.description);
        setCategory(task.category);
        setBudget(task.budget.toString());
        if (task.deadline) {
          const d = new Date(task.deadline);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          setDeadline(`${year}-${month}-${day}`);
        }
        setContactEmail(task.contactEmail);
        setContactPhone(task.contactPhone);
        setExistingImages(task.images || []);
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to fetch task details");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTask();
  }, [id]);

  const handleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("budget", budget);
      formData.append("deadline", deadline ? new Date(deadline).toISOString() : "");
      formData.append("contactEmail", contactEmail);
      formData.append("contactPhone", contactPhone);
      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("images", selectedFiles[i]);
        }
      }
      await axios.put(`http://localhost:5000/api/tasks/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Task updated successfully!");
      router.push("/dashboard/tasks");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Edit Task</h1>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <form onSubmit={handleUpdateTask} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="budget">Budget</Label>
          <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="images">Upload New Images (optional)</Label>
          <Input id="images" type="file" multiple onChange={handleFilesChange} />
          {existingImages.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-semibold">Existing Images:</p>
              <div className="flex gap-2">
                {existingImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.startsWith("http") ? img : `http://localhost:5000${img}`}
                    alt={`Task image ${idx}`}
                    className="h-16 w-16 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Updating Task..." : "Update Task"}
          </Button>
        </div>
      </form>
    </div>
  );
}