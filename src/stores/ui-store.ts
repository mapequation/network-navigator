import { makeAutoObservable } from "mobx";

export class UiStore {
  loadOpen = true;
  helpOpen = false;
  infomapRunning = false;
  infomapProgress = 0;
  infomapLog: string[] = [];
  loadError: string | null = null;
  /** Error from the sidebar Infomap run (shown in the Modules section). */
  infomapError: string | null = null;
  /** Sidebar Infomap options. */
  twoLevel = false;
  regularized = false;
  infomapFlags = "";

  constructor() {
    makeAutoObservable(this);
  }

  openLoad = (): void => {
    this.loadOpen = true;
    this.helpOpen = false;
  };
  setLoadOpen = (open: boolean): void => {
    this.loadOpen = open;
  };
  setHelpOpen = (open: boolean): void => {
    this.helpOpen = open;
  };
  setLoadError = (message: string | null): void => {
    this.loadError = message;
  };
  startInfomap = (): void => {
    this.infomapRunning = true;
    this.infomapProgress = 0;
    this.infomapLog = [];
    this.loadError = null;
    this.infomapError = null;
  };
  setInfomapError = (message: string | null): void => {
    this.infomapError = message;
  };
  setTwoLevel = (on: boolean): void => {
    this.twoLevel = on;
  };
  setRegularized = (on: boolean): void => {
    this.regularized = on;
  };
  setInfomapFlags = (flags: string): void => {
    this.infomapFlags = flags;
  };
  onInfomapProgress = (percent: number): void => {
    this.infomapProgress = percent;
  };
  onInfomapLog = (line: string): void => {
    this.infomapLog.push(line);
  };
  finishInfomap = (): void => {
    this.infomapRunning = false;
  };
}
