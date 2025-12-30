import axios from 'axios';

// Pinata Configuration
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';
const PUBLIC_GATEWAY = 'https://ipfs.io/ipfs';

export class IPFSService {
  /**
   * Test Pinata authentication
   * @returns {Promise<Object>} Authentication result
   */
  static async testAuth() {
    try {
      if (!PINATA_JWT) {
        throw new Error('Pinata JWT not configured');
      }

      const response = await axios.get(
        'https://api.pinata.cloud/data/testAuthentication',
        {
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
          },
        }
      );

      return {
        success: true,
        authenticated: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Pinata authentication failed:', error);
      return {
        success: false,
        authenticated: false,
        error: error.response?.data?.error?.details || error.message,
      };
    }
  }

  /**
   * Upload file to IPFS via Pinata
   * @param {File} file - File to upload
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result with IPFS hash
   */
  static async uploadToPinata(file, metadata = {}) {
    try {
      if (!PINATA_JWT) {
        throw new Error('Pinata JWT not configured');
      }

      if (!file) {
        throw new Error('No file provided');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Add metadata
      const pinataMetadata = {
        name: file.name,
        keyvalues: {
          type: 'certificate',
          uploadedAt: Date.now(),
          ...metadata,
        },
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      // Add pinata options
      const pinataOptions = JSON.stringify({
        cidVersion: 1, // Use CID v1 for better compatibility
      });
      formData.append('pinataOptions', pinataOptions);

      // Upload to Pinata
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity, // Important for large files
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
            // Don't set Content-Type, axios will set it with boundary
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;

      return {
        success: true,
        ipfsHash: ipfsHash,
        pinataUrl: `${PINATA_GATEWAY}/${ipfsHash}`,
        publicUrl: `${PUBLIC_GATEWAY}/${ipfsHash}`,
        timestamp: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      };
    } catch (error) {
      console.error('Error uploading to IPFS:', error);

      let errorMessage = error.message;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        errorMessage = JSON.stringify(error.response.data);
      }

      return {
        success: false,
        error: errorMessage,
        code: error.response?.status,
      };
    }
  }

  /**
   * Upload JSON metadata to IPFS
   * @param {Object} metadata - JSON object to upload
   * @param {string} name - Name for the metadata
   * @returns {Promise<Object>} Upload result
   */
  static async uploadMetadataToIPFS(metadata, name = 'certificate-metadata') {
    try {
      if (!PINATA_JWT) {
        throw new Error('Pinata JWT not configured');
      }

      const dataToUpload = {
        pinataContent: metadata,
        pinataMetadata: {
          name: name,
          keyvalues: {
            type: 'certificate-metadata',
            timestamp: Date.now(),
          },
        },
      };

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        dataToUpload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PINATA_JWT}`,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;

      return {
        success: true,
        ipfsHash: ipfsHash,
        pinataUrl: `${PINATA_GATEWAY}/${ipfsHash}`,
        publicUrl: `${PUBLIC_GATEWAY}/${ipfsHash}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error);

      let errorMessage = error.message;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      return {
        success: false,
        error: errorMessage,
        code: error.response?.status,
      };
    }
  }

  /**
   * Retrieve file from IPFS
   * @param {string} ipfsHash - IPFS CID/hash
   * @param {boolean} usePinataGateway - Use Pinata gateway or public gateway
   * @returns {string} URL to access the file
   */
  static getIPFSFileUrl(ipfsHash, usePinataGateway = false) {
    if (!ipfsHash || ipfsHash.trim() === '') {
      return '';
    }

    const gateway = usePinataGateway ? PINATA_GATEWAY : PUBLIC_GATEWAY;
    return `${gateway}/${ipfsHash}`;
  }

  /**
   * Get multiple gateway URLs for redundancy
   * @param {string} ipfsHash - IPFS CID/hash
   * @returns {Array} Array of gateway URLs
   */
  static getAllGatewayUrls(ipfsHash) {
    if (!ipfsHash || ipfsHash.trim() === '') {
      return [];
    }

    return [
      `${PINATA_GATEWAY}/${ipfsHash}`,
      `${PUBLIC_GATEWAY}/${ipfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      `https://dweb.link/ipfs/${ipfsHash}`,
      `https://ipfs.infura.io/ipfs/${ipfsHash}`,
    ];
  }

  /**
   * Validate IPFS hash/CID
   * @param {string} ipfsHash - IPFS hash to validate
   * @returns {boolean} True if valid
   */
  static isValidIPFSHash(ipfsHash) {
    if (!ipfsHash || typeof ipfsHash !== 'string') {
      return false;
    }

    // Basic validation for IPFS hashes
    // CID v0: Qm... (46 characters)
    // CID v1: bafy... (59+ characters)
    const trimmedHash = ipfsHash.trim();

    // Check for common IPFS hash patterns
    if (trimmedHash.startsWith('Qm') && trimmedHash.length === 46) {
      return true; // CID v0
    }

    if (trimmedHash.startsWith('bafy') && trimmedHash.length >= 59) {
      return true; // CID v1
    }

    if (trimmedHash.startsWith('bafk') || trimmedHash.startsWith('baey')) {
      return true; // Other CID v1 prefixes
    }

    return false;
  }

  /**
   * Extract filename from IPFS hash
   * @param {string} ipfsHash - IPFS hash
   * @param {string} originalFilename - Original filename
   * @returns {string} Display filename
   */
  static getDisplayFilename(ipfsHash, originalFilename = '') {
    if (originalFilename) {
      return originalFilename;
    }

    if (ipfsHash) {
      return `certificate-${ipfsHash.substring(0, 8)}...`;
    }

    return 'certificate-file';
  }

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file type is supported
   * @param {File} file - File to check
   * @returns {boolean} True if supported
   */
  static isSupportedFileType(file) {
    if (!file || !file.type) {
      return false;
    }

    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ];

    return supportedTypes.includes(file.type.toLowerCase());
  }

  /**
   * Get maximum file size allowed (10MB)
   * @returns {number} Max size in bytes
   */
  static getMaxFileSize() {
    return 10 * 1024 * 1024; // 10MB
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  static validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file selected');
      return { valid: false, errors };
    }

    // Check file size
    const maxSize = this.getMaxFileSize();
    if (file.size > maxSize) {
      errors.push(
        `File too large. Maximum size is ${this.formatFileSize(maxSize)}`
      );
    }

    // Check file type
    if (!this.isSupportedFileType(file)) {
      errors.push(
        'File type not supported. Supported types: PDF, JPG, PNG, WEBP, SVG'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      fileSize: this.formatFileSize(file.size),
      fileType: file.type,
    };
  }
}

export default IPFSService;
