import axios from "axios";

export const API = axios.create({
    baseURL: "http://localhost:3001/api"
});

// incidents
export const getIncidents = () => API.get("/incidents");

// upload
export const uploadIncidents = (data) =>
    API.post("/incidents", data);
