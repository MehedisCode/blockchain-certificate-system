import { ethers } from 'ethers';
import CertificationABI from '../contracts/Certification.json';

const CERTIFICATION_CONTRACT_ADDRESS = import.meta.env
  .VITE_CERTIFICATION_ADDRESS;

export class CertificateContract {
  static async getContract() {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      return new ethers.Contract(
        CERTIFICATION_CONTRACT_ADDRESS,
        CertificationABI.abi,
        signer
      );
    }
    throw new Error('MetaMask not installed');
  }

  static async generateCertificate(certificateData, ipfsHash) {
    try {
      const contract = await this.getContract();

      const tx = await contract.generateCertificate(
        certificateData.id,
        certificateData.candidateName,
        certificateData.candidateId,
        certificateData.fatherName,
        certificateData.motherName,
        certificateData.degreeIndex,
        certificateData.departmentIndex,
        certificateData.cgpa,
        certificateData.session,
        certificateData.creationDate,
        ipfsHash // IPFS CID
      );

      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        certificateId: certificateData.id,
      };
    } catch (error) {
      console.error('Error generating certificate:', error);
      return { success: false, error: error.message };
    }
  }

  static async verifyCertificate(certificateId) {
    try {
      const contract = await this.getContract();

      const [exists, valid, revoked, issuedBy, ipfsHash, issueTimestamp] =
        await contract.verifyCertificate(certificateId);

      if (!exists) {
        return { exists: false };
      }

      // Get full certificate data
      const [cert, metadata, instituteName, instituteAddress, instituteLink] =
        await contract.getCertificateData(certificateId);

      return {
        exists: true,
        valid: valid,
        revoked: revoked,
        issuedBy: issuedBy,
        ipfsHash: ipfsHash,
        issueTimestamp: issueTimestamp.toNumber(),
        certificateData: {
          ...cert,
          ...metadata,
          instituteName,
          instituteAddress,
          instituteLink,
        },
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return { exists: false, error: error.message };
    }
  }

  static async getCertificateBasicInfo(certificateId) {
    try {
      const contract = await this.getContract();

      const [
        candidateId,
        ipfsHash,
        issuedBy,
        issueTimestamp,
        revoked,
        instituteAcronym,
      ] = await contract.getCertificateBasicInfo(certificateId);

      return {
        candidateId,
        ipfsHash,
        issuedBy,
        issueTimestamp: issueTimestamp.toNumber(),
        revoked,
        instituteAcronym,
      };
    } catch (error) {
      console.error('Error getting certificate info:', error);
      return null;
    }
  }

  static async revokeCertificate(certificateId) {
    try {
      const contract = await this.getContract();
      const tx = await contract.revokeCertificate(certificateId);
      await tx.wait();
      return { success: true };
    } catch (error) {
      console.error('Error revoking certificate:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateCertificateIpfsHash(certificateId, newIpfsHash) {
    try {
      const contract = await this.getContract();
      const tx = await contract.updateCertificateIpfsHash(
        certificateId,
        newIpfsHash
      );
      await tx.wait();
      return { success: true };
    } catch (error) {
      console.error('Error updating certificate:', error);
      return { success: false, error: error.message };
    }
  }

  static async getCertificateStatus(certificateId) {
    try {
      const contract = await this.getContract();
      const status = await contract.getCertificateStatus(certificateId);
      return status;
    } catch (error) {
      console.error('Error getting certificate status:', error);
      return 'ERROR';
    }
  }

  // Generate unique certificate ID
  static generateCertificateId(instituteAcronym, candidateId) {
    const timestamp = Date.now();
    return ethers.utils.id(`${instituteAcronym}-${candidateId}-${timestamp}`);
  }
}
