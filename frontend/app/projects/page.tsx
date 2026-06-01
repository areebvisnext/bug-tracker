"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import ProjectCard from "@/components/projects/ProjectCard";
import { useEffect, useState } from "react";
import { GetProjects, CreateProject, GetDevs, GetQA } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import AddProject from "@/components/projects/AddProject";

export default function Projects() {
  interface Project {
    id: number;
    name: string;
    description: string;
  }
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await getAccessToken();

      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const data = await GetProjects(token);
      setProjects(data);

      //let qa = await GetQA(token);
      let devs = await GetDevs(token);
      //console.log(qa);
      console.log(devs);
    }

    load();
  }, [router]);
  return (
    <>
      <AddProject
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={async (data) => {
          let payload = {
            name: data.name,
            description: data.description,
          };
          console.log(payload);
          const token = await getAccessToken();
          let res = await CreateProject(payload, token);
          console.log(res);
        }}
      />
      <div className="flex min-h-screen flex-col bg-white">
        <AppHeader userName="Areeb" avatarUrl="" />
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
            <button
              className="text-white bg-blue-600 px-4 rounded-md"
              onClick={() => setShowModal(true)}
            >
              Add new Project
            </button>
          </div>
        </div>
        <div className="ml-24 mt-5 mr-20 grid grid-cols-3 gap-y-5">
          {projects.map((a, i) => (
            <ProjectCard
              key={a.id}
              title={a.name}
              description={a.description}
              completed={2}
              total={56}
              iconBg="bg-cyan-300"
            />
          ))}
        </div>
      </div>
    </>
  );
}
