import { makeAutoObservable } from "mobx";

export class UiStore {
  loadOpen = true;
  helpOpen = false;
  infomapRunning = false;
  infomapProgress = 0;
  infomapLog: string[] = [];
  loadError: string | null = null;

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
