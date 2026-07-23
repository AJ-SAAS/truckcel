// lib/uploadDriverFile.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "./firebase";

export async function uploadDriverFile(file: File, type: "license" | "insurance" | "profilePhoto") {
  if (!auth.currentUser) throw new Error("User not authenticated");

  const uid = auth.currentUser.uid;
  
  let path = "";
  if (type === "license") {
    path = `drivers/licenses/${uid}/${file.name}`;
  } else if (type === "insurance") {
    path = `drivers/insurance/${uid}/${file.name}`;
  } else {
    path = `drivers/profilePhotos/${uid}/${file.name}`;
  }

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}