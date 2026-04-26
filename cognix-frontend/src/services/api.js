// import axios from "axios";

// export const API = axios.create({
//     baseURL: "http://localhost:3001/api"
// });

// // incidents
// export const getIncidents = () => API.get("/incidents");

// // upload
// export const uploadIncidents = (data) =>
//     API.post("/incidents", data);


import axios from "axios";

export const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

// incidents basic list
export const getIncidents = () => API.get("/incidents");

// incidents enriched pipeline output
export const getFullIncidents = () => API.get("/incidents/full");

// upload
export const uploadIncidents = (data) =>
    API.post("/incidents", data);

// delete all data
export const resetEnvironment = () => API.delete("/reset");

// throughput
export const getThroughput = () =>
    API.get("/throughput");

// classified count (agent1 output)
export const getAgent1Outputs = () =>
    API.get("/agent1");

// runtime logs
export const getRuntimeLogs = () =>
    API.get("/runtime-log");

// stage throughput
export const getStageThroughput = (stage) =>
    API.get(`/stage-throughput/${stage}`);

// stage latency
export const getStageLatency = (stage) =>
    API.get(`/stage-latency/${stage}`);

// datasets per stage
export const getDatasetByStage = (stage) =>
    API.get(`/${stage}`);

// reports
export const getReports = () => API.get("/reports");