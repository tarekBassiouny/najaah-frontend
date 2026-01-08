export type CenterSetting = {
  id?: string | number;
  key?: string;
  value?: string;
  settings?: Record<string, any> | any[];
  [key: string]: any;
};

export type Center = {
  id: string | number;
  name?: string;
  slug?: string;
  type?: string;
  status?: string;
  settings?: CenterSetting[];
  [key: string]: any;
};
