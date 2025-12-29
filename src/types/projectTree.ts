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
    }
  | {
      type: "project";
      name: string;
      path: string;
    };

