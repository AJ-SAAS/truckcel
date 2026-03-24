import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

// CREATE LOAD
export const createShipment = async (data: any) => {
  return await addDoc(collection(db, "shipments"), {
    ...data,
    status: "NEW",
    createdAt: Date.now(),
  });
};

// GET ALL LOADS
export const getShipments = async () => {
  const snapshot = await getDocs(collection(db, "shipments"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ACCEPT LOAD
export const acceptShipment = async (id: string, userId: string) => {
  return await updateDoc(doc(db, "shipments", id), {
    status: "MATCHED",
    carrierId: userId,
  });
};