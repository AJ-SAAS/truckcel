import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "./firebase";

export async function uploadDriverFile(file: File, type: "license" | "profilePhoto") {
  if (!auth.currentUser) throw new Error("User not authenticated");

  const uid = auth.currentUser.uid;
  const path =
    type === "license"
      ? `drivers/licenses/${uid}/${file.name}`
      : `drivers/profilePhotos/${uid}/${file.name}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);

  return getDownloadURL(storageRef);
}