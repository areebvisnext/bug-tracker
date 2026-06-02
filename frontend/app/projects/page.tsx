"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import ProjectCard from "@/components/projects/ProjectCard";
import { useEffect, useState } from "react";
import {
  GetProjects,
  CreateProject,
  GetDevs,
  GetQA,
  UpdateProject,
  AddMembersToProject,
  getCurrentUser,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import AddProject from "@/components/projects/AddProject";
import EditProject from "@/components/projects/EditProject";

export default function Projects() {
  interface Project {
    id: number;
    name: string;
    description: string | null;
    logo?: string | null;
    created_by: any;
    created_at: string;
  }

  interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
  }

  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [devs, setDevs] = useState<User[]>([]);
  const [qas, setQas] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const userData = await getCurrentUser(token);
        setCurrentUser(userData as User);

        const projectsData = await GetProjects(token);
        setProjects(projectsData);

        const devsData = await GetDevs(token);
        setDevs(devsData);

        const qasData = await GetQA(token);
        setQas(qasData);
      } catch (error) {
        console.error("Error loading projects:", error);
        // If token/user fetch fails, redirect to login
        router.replace("/auth/login");
      }
    }

    load();
  }, [router]);

  async function handleEditSubmit(data: {
    name: string;
    description: string;
    logo: File | null;
    selectedDevs: string[];
    selectedQAs: string[];
  }) {
    const token = await getAccessToken();
    if (!token || !selectedProject) return;

    try {
      const updatedProject = await UpdateProject(
        selectedProject.id,
        {
          name: data.name,
          description: data.description,
          logo: data.logo,
        },
        token,
      );

      const allMemberIds = [...data.selectedDevs, ...data.selectedQAs];
      for (const memberId of allMemberIds) {
        await AddMembersToProject(selectedProject.id, memberId, token);
      }

      // Update projects list
      setProjects((current) =>
        current.map((p) => (p.id === selectedProject.id ? updatedProject : p)),
      );

      setShowEditModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  return (
    <>
      <AddProject
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (data) => {
          const payload = {
            name: data.name,
            description: data.description,
            logo: data.logo,
          };
          const token = await getAccessToken();
          const res = await CreateProject(payload, token);
          setProjects((current) => [res, ...current]);
        }}
      />

      <EditProject
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSubmit={handleEditSubmit}
        devs={devs}
        qas={qas}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <AppHeader userName={currentUser?.full_name || "user"} avatarUrl="" />
        <div className="border-l-4 border-l-green-700 border-y-2 border-y-gray-200 flex justify-between ml-24 mr-20 mt-4 px-2 py-2">
          <div className="flex-col">
            <p className="text-lg font-bold">Visnext Software Solutions</p>
            <span className="text-gray-600 pl-2">
              Hi Dev, Welcome to ManageBug
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="px-2 bg-gray-100 rounded-md"
              placeholder="Search for projects here"
            />
            {currentUser?.role === "Manager" && (
              <button
                className="text-white bg-blue-600 px-4 rounded-md"
                onClick={() => setShowAddModal(true)}
              >
                Add new Project
              </button>
            )}
          </div>
        </div>
        <div className="ml-24 mt-5 mr-20 grid grid-cols-3 gap-y-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.name}
              description={project.description}
              logo={project.logo}
              completed={2}
              total={56}
              iconBg="bg-cyan-300"
              onEdit={
                currentUser?.role === "Manager"
                  ? () => {
                      setSelectedProject(project);
                      setShowEditModal(true);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </>
  );
}
