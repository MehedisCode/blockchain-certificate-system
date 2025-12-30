// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Institution.sol";

contract Certification {
    address public owner;
    Institution public institution;
    
    // Use double mapping to prevent ID collisions
    mapping(address => mapping(bytes32 => Certificate)) private certificates;
    mapping(address => mapping(bytes32 => CertificateDetails)) private certificateDetails;
    mapping(address => mapping(bytes32 => string)) private certificateIpfsHashes;
    
    // Track certificate IDs per institute
    mapping(address => bytes32[]) private instituteCertificateIds;
    
    // Events (consistent naming)
    event CertificateGenerated(bytes32 indexed certificateId, address indexed institute, string candidateId);
    event CertificateRevoked(bytes32 indexed certificateId);
    event CertificateUpdated(bytes32 indexed certificateId, string field);
    event CertificateIpfsUpdated(bytes32 indexed certificateId, string ipfsHash);
    
    struct Certificate {
        string candidateId;
        string candidateName;
        string degreeName;
        string departmentName;
        string instituteAcronym;
        string issueDate;
        uint256 timestamp;
        bool revoked;
        bool hasIpfs;
    }
    
    struct CertificateDetails {
        string fatherName;
        string motherName;
        string cgpa;
        string session;
        string instituteName;
        string instituteAddress;
        string instituteLink;
    }
    
    constructor(Institution _institution) {
        owner = msg.sender;
        institution = _institution;
    }
    
    modifier onlyInstitute() {
        require(
            institution.checkInstitutePermission(msg.sender),
            "Not a registered institute"
        );
        _;
    }
    
    modifier onlyIssuer(bytes32 certificateId) {
        require(
            bytes(certificates[msg.sender][certificateId].candidateId).length > 0,
            "Certificate does not exist"
        );
        _;
    }
    
    modifier validCertificateId(string memory _candidateId) {
        require(bytes(_candidateId).length >= 3, "Candidate ID too short");
        require(bytes(_candidateId).length <= 50, "Candidate ID too long");
        _;
    }
    
    // Generate unique certificate ID with institute prefix
    function generateCertificateId(
        address instituteAddress,
        string memory candidateId
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            instituteAddress,
            candidateId
        ));
    }
    
    function generateCertificate(
        string memory _candidateId,
        string memory _candidateName,
        string memory _fatherName,
        string memory _motherName,
        string memory _degreeName,
        string memory _departmentName,
        string memory _cgpa,
        string memory _session,
        string memory _issueDate,
        string memory _ipfsHash
    ) external onlyInstitute validCertificateId(_candidateId) {
        bytes32 certificateId = generateCertificateId(msg.sender, _candidateId);
        
        require(
            bytes(certificates[msg.sender][certificateId].candidateId).length == 0,
            "Certificate already exists"
        );
        
        // Validate CGPA format
        require(_isValidCgpa(_cgpa), "Invalid CGPA format");
        
        // Get institute info
        (
            string memory instituteName,
            string memory instituteAddress,
            string memory instituteAcronym,
            string memory instituteLink,
            bool isActive,
            ,
            ,
            uint256 degreesCount,
            uint256 departmentsCount
        ) = institution.getInstituteData(msg.sender);
        
        require(isActive, "Institute is not active");
        require(degreesCount > 0, "Institute has no degrees");
        require(departmentsCount > 0, "Institute has no departments");
        
        // Store certificate
        certificates[msg.sender][certificateId] = Certificate({
            candidateId: _candidateId,
            candidateName: _candidateName,
            degreeName: _degreeName,
            departmentName: _departmentName,
            instituteAcronym: instituteAcronym,
            issueDate: _issueDate,
            timestamp: block.timestamp,
            revoked: false,
            hasIpfs: bytes(_ipfsHash).length > 0
        });
        
        // Store details
        certificateDetails[msg.sender][certificateId] = CertificateDetails({
            fatherName: _fatherName,
            motherName: _motherName,
            cgpa: _cgpa,
            session: _session,
            instituteName: instituteName,
            instituteAddress: instituteAddress,
            instituteLink: instituteLink
        });
        
        // Store IPFS hash
        if (bytes(_ipfsHash).length > 0) {
            certificateIpfsHashes[msg.sender][certificateId] = _ipfsHash;
        }
        
        // Track certificate ID
        instituteCertificateIds[msg.sender].push(certificateId);
        
        emit CertificateGenerated(certificateId, msg.sender, _candidateId);
    }
    
    // New function: Generate multiple certificates
    function batchGenerateCertificates(
        string[] memory _candidateIds,
        string[] memory _candidateNames,
        string[] memory _fatherNames,
        string[] memory _motherNames,
        string[] memory _degreeNames,
        string[] memory _departmentNames,
        string[] memory _cgpas,
        string[] memory _sessions,
        string[] memory _issueDates
    ) external onlyInstitute {
        require(_candidateIds.length <= 20, "Batch too large");
        require(_candidateIds.length == _candidateNames.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _candidateIds.length; i++) {
            bytes32 certificateId = generateCertificateId(msg.sender, _candidateIds[i]);
            
            // Skip if already exists
            if (bytes(certificates[msg.sender][certificateId].candidateId).length == 0) {
                _generateSingleCertificate(
                    _candidateIds[i],
                    _candidateNames[i],
                    _fatherNames[i],
                    _motherNames[i],
                    _degreeNames[i],
                    _departmentNames[i],
                    _cgpas[i],
                    _sessions[i],
                    _issueDates[i],
                    ""
                );
            }
        }
    }
    
    function getCertificate(
        address instituteAddress,
        string memory _candidateId
    ) external view returns (
        Certificate memory cert,
        CertificateDetails memory details,
        string memory ipfsHash,
        bool exists
    ) {
        bytes32 certificateId = generateCertificateId(instituteAddress, _candidateId);
        
        cert = certificates[instituteAddress][certificateId];
        details = certificateDetails[instituteAddress][certificateId];
        ipfsHash = certificateIpfsHashes[instituteAddress][certificateId];
        exists = bytes(cert.candidateId).length > 0;
    }
    
    function verifyCertificate(
        address instituteAddress,
        string memory _candidateId
    ) external view returns (
        bool exists,
        bool valid,
        bool revoked,
        bool hasIpfs,
        string memory instituteAcronym
    ) {
        bytes32 certificateId = generateCertificateId(instituteAddress, _candidateId);
        Certificate storage cert = certificates[instituteAddress][certificateId];
        
        exists = bytes(cert.candidateId).length > 0;
        if (exists) {
            revoked = cert.revoked;
            valid = !revoked;
            hasIpfs = cert.hasIpfs;
            instituteAcronym = cert.instituteAcronym;
        }
    }
    
    function revokeCertificate(
        string memory _candidateId
    ) external onlyInstitute onlyIssuer(generateCertificateId(msg.sender, _candidateId)) {
        bytes32 certificateId = generateCertificateId(msg.sender, _candidateId);
        Certificate storage cert = certificates[msg.sender][certificateId];
        
        require(!cert.revoked, "Certificate already revoked");
        cert.revoked = true;
        
        emit CertificateRevoked(certificateId);
    }
    
    // Update IPFS hash
    function updateCertificateIpfs(
        string memory _candidateId,
        string memory _ipfsHash
    ) external onlyInstitute onlyIssuer(generateCertificateId(msg.sender, _candidateId)) {
        bytes32 certificateId = generateCertificateId(msg.sender, _candidateId);
        Certificate storage cert = certificates[msg.sender][certificateId];
        
        require(!cert.revoked, "Certificate is revoked");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        certificateIpfsHashes[msg.sender][certificateId] = _ipfsHash;
        cert.hasIpfs = true;
        
        emit CertificateIpfsUpdated(certificateId, _ipfsHash);
    }
    
    // Get all certificate IDs for an institute
    function getInstituteCertificates(
        address instituteAddress,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory, uint256 total) {
        bytes32[] storage allIds = instituteCertificateIds[instituteAddress];
        total = allIds.length;
        
        if (offset >= total) {
            return (new bytes32[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) end = total;
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allIds[i];
        }
        
        return (result, total);
    }
    
    // Get certificate by ID
    function getCertificateById(
        address instituteAddress,
        bytes32 certificateId
    ) external view returns (
        Certificate memory cert,
        CertificateDetails memory details,
        string memory ipfsHash,
        bool exists
    ) {
        cert = certificates[instituteAddress][certificateId];
        details = certificateDetails[instituteAddress][certificateId];
        ipfsHash = certificateIpfsHashes[instituteAddress][certificateId];
        exists = bytes(cert.candidateId).length > 0;
    }
    
    // Get total certificates count
    function getTotalCertificatesCount(address instituteAddress) 
        external 
        view 
        returns (uint256) 
    {
        return instituteCertificateIds[instituteAddress].length;
    }
    
    // Search certificates by candidate name (partial match)
    function searchCertificates(
        address instituteAddress,
        string memory query,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory, uint256 total) {
        bytes32[] storage allIds = instituteCertificateIds[instituteAddress];
        bytes32[] memory result = new bytes32[](limit);
        
        uint256 count = 0;
        uint256 totalMatches = 0;
        
        // First pass: count matches
        for (uint256 i = 0; i < allIds.length; i++) {
            if (_contains(certificates[instituteAddress][allIds[i]].candidateName, query)) {
                totalMatches++;
            }
        }
        
        // Second pass: collect matches
        for (uint256 i = offset; i < allIds.length && count < limit; i++) {
            if (_contains(certificates[instituteAddress][allIds[i]].candidateName, query)) {
                result[count] = allIds[i];
                count++;
            }
        }
        
        // Resize array
        bytes32[] memory finalResult = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return (finalResult, totalMatches);
    }
    
    // Internal helper functions
    function _generateSingleCertificate(
        string memory _candidateId,
        string memory _candidateName,
        string memory _fatherName,
        string memory _motherName,
        string memory _degreeName,
        string memory _departmentName,
        string memory _cgpa,
        string memory _session,
        string memory _issueDate,
        string memory _ipfsHash
    ) internal {
        bytes32 certificateId = generateCertificateId(msg.sender, _candidateId);
        
        // Get institute data
        (
            string memory instituteName,
            string memory instituteAddress,
            string memory instituteAcronym,
            string memory instituteLink,
            bool isActive,
            ,
            ,
            ,
        ) = institution.getInstituteData(msg.sender);
        
        require(isActive, "Institute is not active");
        
        certificates[msg.sender][certificateId] = Certificate({
            candidateId: _candidateId,
            candidateName: _candidateName,
            degreeName: _degreeName,
            departmentName: _departmentName,
            instituteAcronym: instituteAcronym,
            issueDate: _issueDate,
            timestamp: block.timestamp,
            revoked: false,
            hasIpfs: bytes(_ipfsHash).length > 0
        });
        
        certificateDetails[msg.sender][certificateId] = CertificateDetails({
            fatherName: _fatherName,
            motherName: _motherName,
            cgpa: _cgpa,
            session: _session,
            instituteName: instituteName,
            instituteAddress: instituteAddress,
            instituteLink: instituteLink
        });
        
        if (bytes(_ipfsHash).length > 0) {
            certificateIpfsHashes[msg.sender][certificateId] = _ipfsHash;
        }
        
        instituteCertificateIds[msg.sender].push(certificateId);
        
        emit CertificateGenerated(certificateId, msg.sender, _candidateId);
    }
    
    function _isValidCgpa(string memory cgpa) internal pure returns (bool) {
        bytes memory b = bytes(cgpa);
        if (b.length == 0 || b.length > 5) return false;
        
        uint256 dotCount = 0;
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            if (char >= 0x30 && char <= 0x39) {
                // 0-9
            } else if (char == 0x2E) {
                // dot
                dotCount++;
                if (dotCount > 1) return false;
            } else {
                return false;
            }
        }
        return true;
    }
    
    function _contains(string memory str, string memory substr) 
        internal 
        pure 
        returns (bool) 
    {
        bytes memory strBytes = bytes(str);
        bytes memory subBytes = bytes(substr);
        
        if (subBytes.length > strBytes.length) return false;
        if (subBytes.length == 0) return true;
        
        for (uint256 i = 0; i <= strBytes.length - subBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < subBytes.length; j++) {
                if (strBytes[i + j] != subBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }
}