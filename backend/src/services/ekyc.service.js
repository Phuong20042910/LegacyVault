const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

/**
 * FPT.AI eKYC Service Adapter (NFR-010 — Adapter Pattern)
 * API docs: https://fpt.ai/ekyc
 *
 * In development/demo mode (no API key), returns mock success.
 */

const FPTAI_BASE_URL = process.env.FPTAI_EKYC_BASE_URL || "https://api.fpt.ai/vision/idr/vnm";
const API_KEY = process.env.FPTAI_EKYC_API_KEY;

/**
 * Extract information from national ID card
 * @param {string} idCardPath - Path to the ID card image
 * @returns {Object} - Extracted data
 */
const extractIdCard = async (idCardPath) => {
  if (!API_KEY || API_KEY === "your_fptai_api_key") {
    // Mock mode for development
    console.warn("[eKYC] Running in MOCK mode — no real API key configured.");
    return {
      success: true,
      data: {
        id: "123456789012",
        name: "MOCK USER",
        dob: "01/01/1990",
        address: "Mock Address, Vietnam",
      },
    };
  }

  const form = new FormData();
  form.append("image", fs.createReadStream(idCardPath));

  try {
    const response = await axios.post(FPTAI_BASE_URL, form, {
      headers: {
        ...form.getHeaders(),
        "api-key": API_KEY,
      },
      timeout: 30000,
    });

    if (response.data && response.data.errorCode === 0) {
      const info = response.data.data?.[0] || {};
      return {
        success: true,
        data: {
          id: info.id,
          name: info.name,
          dob: info.dob,
          address: info.address,
          confidence: info.confidence,
        },
      };
    }
    return { success: false, message: response.data?.errorMessage || "Không đọc được thông tin CCCD." };
  } catch (err) {
    console.error("[eKYC] ID extraction error:", err.message);
    return { success: false, message: "Lỗi kết nối dịch vụ eKYC." };
  }
};

/**
 * Verify face matching between ID card and selfie
 * @param {string} idCardPath - Path to ID card image
 * @param {string} selfiePath - Path to selfie image
 * @returns {Object} - Similarity score and result
 */
const verifyFaceMatch = async (idCardPath, selfiePath) => {
  if (!API_KEY || API_KEY === "your_fptai_api_key") {
    // Mock: always return success with high similarity
    return { success: true, similarity: 0.985, message: "Mock face match — development mode" };
  }

  const FACE_COMPARE_URL = "https://api.fpt.ai/vision/face/compare";
  const form = new FormData();
  form.append("image1", fs.createReadStream(idCardPath));
  form.append("image2", fs.createReadStream(selfiePath));

  try {
    const response = await axios.post(FACE_COMPARE_URL, form, {
      headers: {
        ...form.getHeaders(),
        "api-key": API_KEY,
      },
      timeout: 30000,
    });

    if (response.data) {
      const similarity = response.data.data?.similarity || 0;
      // NFR-002: FAR <= 0.001%, threshold 0.75
      const passed = similarity >= 0.75;
      return {
        success: passed,
        similarity,
        message: passed ? "Khuôn mặt khớp." : `Khuôn mặt không khớp (độ tương đồng: ${(similarity * 100).toFixed(1)}%).`,
      };
    }
    return { success: false, message: "Không thể so sánh khuôn mặt." };
  } catch (err) {
    console.error("[eKYC] Face match error:", err.message);
    return { success: false, message: "Lỗi kết nối dịch vụ xác thực khuôn mặt." };
  }
};

/**
 * Full eKYC verification flow
 * @param {Object} params - { idCardPath, selfiePath, nationalId }
 */
exports.verifyIdentity = async ({ idCardPath, selfiePath, nationalId }) => {
  try {
    // Step 1: Extract ID card information
    const idResult = await extractIdCard(idCardPath);
    if (!idResult.success) {
      return { success: false, message: `Không đọc được thông tin CCCD: ${idResult.message}` };
    }

    // Step 2: Face liveness match (NFR-002)
    const faceResult = await verifyFaceMatch(idCardPath, selfiePath);
    if (!faceResult.success) {
      return { success: false, message: faceResult.message, similarity: faceResult.similarity };
    }

    // Step 3: ID number cross-check if available
    if (nationalId && idResult.data.id && !API_KEY?.startsWith("your_")) {
      const normalizedExtracted = idResult.data.id?.replace(/\s/g, "");
      const normalizedProvided = nationalId.replace(/\s/g, "");
      if (normalizedExtracted !== normalizedProvided) {
        return {
          success: false,
          message: "Số CCCD không khớp với hồ sơ đăng ký.",
        };
      }
    }

    return {
      success: true,
      similarity: faceResult.similarity,
      extractedData: idResult.data,
    };
  } catch (err) {
    console.error("[eKYC] Verification error:", err.message);
    return { success: false, message: "Lỗi hệ thống xác thực danh tính." };
  }
};
