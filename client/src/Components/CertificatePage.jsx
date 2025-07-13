import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CertificationAbi from '../contracts/Certification.json';
import { ethers } from 'ethers';
import { decrypt } from './decrypt';

const certificationAddress = import.meta.env.VITE_CERTIFICATION_ADDRESS;
const salt = import.meta.env.VITE_SALT; // Add this in your .env

const CertificatePage = () => {
  const { id } = useParams();
  const [candidateName, setCandidateName] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [courseIndex, setCourseIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCertificate = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const certification = new ethers.Contract(
        certificationAddress,
        CertificationAbi.abi,
        provider
      );

      const [encryptedName, index, encryptedDate] =
        await certification.getData(id);

      const decryptedName = decrypt(encryptedName, id, salt);
      const decryptedDate = new Date(
        parseInt(decrypt(encryptedDate, id, salt))
      ).toLocaleString();

      setCandidateName(decryptedName);
      setCreationDate(decryptedDate);
      setCourseIndex(index);
    } catch (error) {
      console.error('Error loading certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificate();
  }, [id]);

  if (loading) return <div>Loading certificate...</div>;

  return (
    <div>
      <h2>Certificate Details</h2>
      <p>
        <strong>Certificate ID:</strong> {id}
      </p>
      <p>
        <strong>Candidate Name:</strong> {candidateName}
      </p>
      <p>
        <strong>Course Index:</strong> {courseIndex}
      </p>
      <p>
        <strong>Issued On:</strong> {creationDate}
      </p>
    </div>
  );
};

export default CertificatePage;
