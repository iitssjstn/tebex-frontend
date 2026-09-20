import { getSetting, setSetting } from "./settings";

export const getHome = (preview: boolean) => (preview ? getSetting("home.draft") : getSetting("home.published"));
export const homeHasUnpublished = (): boolean => JSON.stringify(getSetting("home.draft")) !== JSON.stringify(getSetting("home.published"));
export const publishHome = () => setSetting("home.published", getSetting("home.draft"));
