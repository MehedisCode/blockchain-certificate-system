// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./Institution.sol";

contract Certification {
    // State Variables
    address public owner;
    Institution public institution;

    // Mappings
    mapping(bytes32 => Certificate) private certificates;

    // Events
    event certificateGenerated(bytes32 _certificateId);
    event certificateRevoked(bytes32 _certificateId);

    constructor(Institution _institution) {
        owner = msg.sender;
        institution = _institution;
    }

    struct Certificate {
        // Individual Info
        string candidate_name;
        string candidate_id;
        string father_name;
        string mother_name;
        string degree_name;
        string department_name;
        string cgpa;
        string session;
        string creation_date;
        // Institute Info
        string institute_name;
        string institute_address;
        string institute_acronym;
        string institute_link;
        // Revocation status
        bool revoked;
    }

    function stringToBytes32(
        string memory source
    ) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }

    function generateCertificate(
        string memory _id,
        string memory _candidate_name,
        string memory _candidate_id,
        string memory _father_name,
        string memory _mother_name,
        uint256 _degree_index,
        uint256 _departments_index,
        string memory _cgpa,
        string memory _session,
        string memory _creation_date
    ) public {
        require(
            institution.checkInstitutePermission(msg.sender) == true,
            "Institute account does not exist"
        );
        bytes32 byte_id = stringToBytes32(_id);
        // require(certificates[byte_id].creation_date == 0, "Certificate with given id already exists");
        bytes memory tempEmptyStringNameTest = bytes(
            certificates[byte_id].creation_date
        );

        require(
            tempEmptyStringNameTest.length == 0,
            "Certificate with given id already exists"
        );

        (
            string memory _institute_name,
            string memory _institute_address,
            string memory _institute_acronym,
            string memory _institute_link,
            Institution.Degree[] memory _institute_degree,
            Institution.Department[] memory _institute_departments
        ) = institution.getInstituteData(msg.sender);

        require(
            _degree_index >= 0 && _degree_index < _institute_degree.length,
            "Invalid Degree index"
        );
        require(
            _departments_index >= 0 &&
                _departments_index < _institute_departments.length,
            "Invalid Department index"
        );

        string memory _degree_name = _institute_degree[_degree_index]
            .degree_name;
        string memory _department_name = _institute_departments[
            _departments_index
        ].department_name;

        bool revocation_status = false;

        certificates[byte_id] = Certificate(
            _candidate_name,
            _candidate_id,
            _father_name,
            _mother_name,
            _degree_name,
            _department_name,
            _cgpa,
            _session,
            _creation_date,
            _institute_name,
            _institute_address,
            _institute_acronym,
            _institute_link,
            revocation_status
        );
        emit certificateGenerated(byte_id);
    }

    function getData(
        string memory _id
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            bool
        )
    {
        bytes32 byte_id = stringToBytes32(_id);
        Certificate memory temp = certificates[byte_id];
        // require(certificates[byte_id].creation_date != 0, "Certificate id does not exist!");
        bytes memory tempEmptyStringNameTest = bytes(
            certificates[byte_id].creation_date
        );
        require(
            tempEmptyStringNameTest.length != 0,
            "Certificate id does not exist"
        );
        return (
            temp.candidate_name,
            temp.candidate_id,
            temp.father_name,
            temp.mother_name,
            temp.degree_name,
            temp.department_name,
            temp.cgpa,
            temp.session,
            temp.creation_date,
            temp.institute_name,
            temp.institute_address,
            temp.institute_acronym,
            temp.institute_link,
            temp.revoked
        );
    }

    function revokeCertificate(string memory _id) public {
        require(
            institution.checkInstitutePermission(msg.sender) == true,
            "Institute account does not exist"
        );
        bytes32 byte_id = stringToBytes32(_id);
        bytes memory tempEmptyStringNameTest = bytes(
            certificates[byte_id].creation_date
        );
        require(
            tempEmptyStringNameTest.length != 0,
            "Certificate id does not exist"
        );
        certificates[byte_id].revoked = true;
        emit certificateRevoked(byte_id);
    }
}
