import express from 'express';
import { createCollection } from '../collection-controllers/createCollection.js';
import { getCollections } from '../collection-controllers/getCollections.js';
import { getCollectionData } from '../collection-controllers/getCollectionData.js';
import { insertDocument } from '../collection-controllers/insertDocument.js';



const router = express.Router();

router.post("/create-collection", createCollection);

router.get("/get-collection-names", getCollections);

router.get("/get-collection-data", getCollectionData);

router.post("/insert-into-collection", insertDocument);

export default router;