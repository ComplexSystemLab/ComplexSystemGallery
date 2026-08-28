export type ProjectTree = {
  type: "root";
  name: string;
  path: string;
  source: string;
  generatedAt: string;
  children: ProjectTreeNode[];
};

export type ProjectTreeNode =
  | {
      type: "folder";
      name: string;
      path: string;
      children: ProjectTreeNode[];
      projectMarker?: boolean;
    }
  | {
      type: "project";
      name: string;
      path: string;
      autoDemoUrl?: string;
      detectedBy?: "project.txt" | "html-entry";
      projectFiles?: string[];
    };

