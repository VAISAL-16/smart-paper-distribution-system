import Center from "../models/Center.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendList, sendSuccess } from "../utils/apiResponse.js";
import { normalizeText } from "../utils/validators.js";

const recalcStats = (centerDoc) => {
  const requests = centerDoc.requests || [];
  const papers = centerDoc.papers || [];
  const printLogs = centerDoc.printLogs || [];

  const approvedRequests = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedRequests = requests.filter((r) => r.status === "REJECTED").length;
  const forwardedRequests = requests.filter((r) => r.status === "FORWARDED_TO_ADMIN").length;
  const pendingRequests = requests.filter((r) => r.status === "PENDING_SETTER_APPROVAL").length;
  const releasedPapers = papers.filter((p) => p.status === "RELEASED").length;
  const totalPrintedCopies = printLogs.reduce((sum, item) => sum + (Number(item.copies) || 0), 0);

  centerDoc.stats = {
    totalRequests: requests.length,
    approvedRequests,
    rejectedRequests,
    pendingRequests,
    forwardedRequests,
    totalPapers: papers.length,
    releasedPapers,
    totalPrintedCopies,
    totalPrintEvents: printLogs.length,
    lastPrintedAt: printLogs.length > 0 ? printLogs[printLogs.length - 1].printedAt : null
  };
};

export const trackCenterEvent = asyncHandler(async (req, res) => {
  const { centerName, requestEvent, paperEvent, printEvent } = req.body;
  const normalizedCenterName = normalizeText(centerName);

  if (!normalizedCenterName) {
    throw new AppError(400, "centerName is required");
  }

  let center = await Center.findOne({ centerName: normalizedCenterName });
  if (!center) {
    center = await Center.create({
      centerName: normalizedCenterName,
      requests: [],
      papers: [],
      printLogs: []
    });
  }

  if (requestEvent && requestEvent.requestId) {
    const idx = center.requests.findIndex((r) => r.requestId === requestEvent.requestId);
    const payload = {
      requestId: requestEvent.requestId,
      institutionName: normalizeText(requestEvent.institutionName),
      course: normalizeText(requestEvent.course),
      examDate: normalizeText(requestEvent.examDate),
      status: normalizeText(requestEvent.status),
      requestedCopies: Number(requestEvent.requestedCopies) || 0,
      maxAllowedCopies: Number(requestEvent.maxAllowedCopies) || 0,
      approvedCopies: Number(requestEvent.approvedCopies) || 0,
      requestedBy: normalizeText(requestEvent.requestedBy),
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) center.requests[idx] = payload;
    else center.requests.push(payload);
  }

  if (paperEvent && paperEvent.paperId) {
    const idx = center.papers.findIndex((p) => p.paperId === paperEvent.paperId);
    const payload = {
      paperId: paperEvent.paperId,
      examId: normalizeText(paperEvent.examId),
      course: normalizeText(paperEvent.course),
      subject: normalizeText(paperEvent.subject),
      status: normalizeText(paperEvent.status),
      uploadedBy: normalizeText(paperEvent.uploadedBy),
      uploadedAt: normalizeText(paperEvent.uploadedAt),
      releaseTime: normalizeText(paperEvent.releaseTime),
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) center.papers[idx] = payload;
    else center.papers.push(payload);
  }

  if (printEvent) {
    center.printLogs.push({
      paperId: normalizeText(printEvent.paperId),
      printedBy: normalizeText(printEvent.printedBy),
      copies: Number(printEvent.copies) || 1,
      printedAt: normalizeText(printEvent.printedAt) || new Date().toISOString()
    });
  }

  recalcStats(center);
  await center.save();

  return sendSuccess(res, { center }, "Center tracked");
});

export const getAllCenters = asyncHandler(async (_req, res) => {
  const centers = await Center.find({}).sort({ centerName: 1 }).lean();
  return sendList(res, centers, { count: centers.length }, "Centers fetched");
});

export const getCenterByName = asyncHandler(async (req, res) => {
  const name = normalizeText(req.params.centerName);
  const center = await Center.findOne({ centerName: name }).lean();
  if (!center) {
    throw new AppError(404, "Center not found");
  }
  return sendSuccess(res, { center }, "Center fetched");
});

export const upsertCenterMaster = asyncHandler(async (req, res) => {
  const {
    centerName,
    institutionName = "",
    venue = "",
    address = "",
    city = "",
    district = "",
    state = "",
    contactPerson = "",
    contactPhone = ""
  } = req.body;

  const normalizedCenterName = normalizeText(centerName);
  if (!normalizedCenterName) {
    throw new AppError(400, "centerName is required");
  }

  const center = await Center.findOneAndUpdate(
    { centerName: normalizedCenterName },
    {
      $set: {
        institutionName: normalizeText(institutionName),
        venue: normalizeText(venue),
        address: normalizeText(address),
        city: normalizeText(city),
        district: normalizeText(district),
        state: normalizeText(state),
        contactPerson: normalizeText(contactPerson),
        contactPhone: normalizeText(contactPhone)
      },
      $setOnInsert: {
        requests: [],
        papers: [],
        printLogs: []
      }
    },
    { new: true, upsert: true }
  );

  recalcStats(center);
  await center.save();
  return sendSuccess(res, { center }, "Center saved");
});
