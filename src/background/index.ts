import { callModel } from "../model/client";
import { isFillPageRequest } from "../shared/messages";
import { StorageRepository, type StorageArea } from "../shared/storage";
import { FillOrchestrator } from "./orchestrator";

const storageArea: StorageArea = {
  get: (keys) => chrome.storage.local.get(keys),
  set: (items) => chrome.storage.local.set(items),
  remove: (keys) => chrome.storage.local.remove(keys)
};
const orchestrator = new FillOrchestrator(new StorageRepository(storageArea), callModel);

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!isFillPageRequest(message)) return false;
  void orchestrator
    .fill(message, sender.tab?.id)
    .then(sendResponse);
  return true;
});
