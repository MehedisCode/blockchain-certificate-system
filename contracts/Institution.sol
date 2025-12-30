// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Institution {
    address public immutable owner;
    
    // Structs
    struct Institute {
        string name;
        string addressLine;
        string acronym;
        string website;
        bool isActive;
        uint256 registrationDate;
        uint256 lastUpdated;
    }
    
    struct Degree {
        string degree_name;
        uint256 addedAt;
    }
    
    struct Department {
        string department_name;
        uint256 addedAt;
    }
    
    // Mappings
    mapping(address => Institute) private institutes;
    mapping(address => Degree[]) private degrees;
    mapping(address => Department[]) private departments;
    mapping(string => bool) private usedAcronyms;
    
    // Arrays
    address[] private instituteAddresses;
    
    // Events
    event InstituteAdded(address indexed instituteAddress, string name, string acronym);
    event InstituteUpdated(address indexed instituteAddress, string field, uint256 timestamp);
    event DegreeAdded(address indexed instituteAddress, string degreeName, uint256 index);
    event DegreeRemoved(address indexed instituteAddress, uint256 index);
    event DepartmentAdded(address indexed instituteAddress, string departmentName, uint256 index);
    event DepartmentRemoved(address indexed instituteAddress, uint256 index);
    
    constructor() {
        owner = msg.sender;
    }
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyInstitute(address addr) {
        require(institutes[addr].isActive, "Not an active institute");
        _;
    }
    
    modifier validAddress(address addr) {
        require(addr != address(0), "Zero address not allowed");
        _;
    }
    
    modifier validString(string memory str, uint256 minLength) {
        require(bytes(str).length >= minLength, "String too short");
        require(bytes(str).length <= 256, "String too long");
        _;
    }
    
    /**
     * @dev Add new institute
     */
    function addInstitute(
        address instituteAddress,
        string memory name,
        string memory addressLine,
        string memory acronym,
        string memory website,
        string[] memory initialDegrees,
        string[] memory initialDepartments
    ) external onlyOwner validAddress(instituteAddress) {
        require(!institutes[instituteAddress].isActive, "Institute already exists");
        require(!usedAcronyms[acronym], "Acronym already used");
        
        _validateInstituteData(name, addressLine, acronym, website);
        
        institutes[instituteAddress] = Institute({
            name: name,
            addressLine: addressLine,
            acronym: acronym,
            website: website,
            isActive: true,
            registrationDate: block.timestamp,
            lastUpdated: block.timestamp
        });
        
        usedAcronyms[acronym] = true;
        instituteAddresses.push(instituteAddress);
        
        // Add initial degrees
        for (uint256 i = 0; i < initialDegrees.length; i++) {
            _addDegree(instituteAddress, initialDegrees[i]);
        }
        
        // Add initial departments
        for (uint256 i = 0; i < initialDepartments.length; i++) {
            _addDepartment(instituteAddress, initialDepartments[i]);
        }
        
        emit InstituteAdded(instituteAddress, name, acronym);
    }
    
    /**
     * @dev Get all institute addresses
     */
    function getAllInstitutes() external view returns (address[] memory) {
        return instituteAddresses;
    }
    
    /**
     * @dev Get institute count
     */
    function getInstituteCount() external view returns (uint256) {
        return instituteAddresses.length;
    }
    
    /**
     * @dev Get institute by index
     */
    function getInstituteByIndex(uint256 index) 
        external 
        view 
        returns (address instituteAddress, string memory name, string memory acronym, bool isActive) 
    {
        require(index < instituteAddresses.length, "Index out of bounds");
        address addr = instituteAddresses[index];
        Institute storage institute = institutes[addr];
        return (addr, institute.name, institute.acronym, institute.isActive);
    }
    
    /**
     * @dev Get complete institute data
     */
    function getInstituteData(address instituteAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory addressLine,
            string memory acronym,
            string memory website,
            bool isActive,
            uint256 registrationDate,
            uint256 lastUpdated,
            uint256 degreesCount,
            uint256 departmentsCount
        ) 
    {
        Institute storage institute = institutes[instituteAddress];
        require(institute.isActive, "Institute not active");
        
        return (
            institute.name,
            institute.addressLine,
            institute.acronym,
            institute.website,
            institute.isActive,
            institute.registrationDate,
            institute.lastUpdated,
            degrees[instituteAddress].length,
            departments[instituteAddress].length
        );
    }
    
    /**
     * @dev Get institute detailed info with lists
     */
    function getInstituteDetailedInfo(address instituteAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory addressLine,
            string memory acronym,
            string memory website,
            string[] memory degreeNames,
            string[] memory departmentNames
        ) 
    {
        Institute storage institute = institutes[instituteAddress];
        require(institute.isActive, "Institute not active");
        
        Degree[] storage degs = degrees[instituteAddress];
        Department[] storage depts = departments[instituteAddress];
        
        degreeNames = new string[](degs.length);
        departmentNames = new string[](depts.length);
        
        for (uint256 i = 0; i < degs.length; i++) {
            degreeNames[i] = degs[i].degree_name;
        }
        
        for (uint256 i = 0; i < depts.length; i++) {
            departmentNames[i] = depts[i].department_name;
        }
        
        return (
            institute.name,
            institute.addressLine,
            institute.acronym,
            institute.website,
            degreeNames,
            departmentNames
        );
    }
    
    /**
     * @dev Check institute permission
     */
    function checkInstitutePermission(address instituteAddress) 
        external 
        view 
        returns (bool) 
    {
        return institutes[instituteAddress].isActive;
    }
    
    /**
     * @dev Get institute basic info
     */
    function getInstituteInfo(address instituteAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory acronym,
            string memory website,
            bool isActive
        ) 
    {
        Institute storage institute = institutes[instituteAddress];
        return (
            institute.name,
            institute.acronym,
            institute.website,
            institute.isActive
        );
    }
    
    /**
     * @dev Get all degrees
     */
    function getDegrees(address instituteAddress) 
        external 
        view 
        returns (string[] memory, uint256[] memory) 
    {
        Degree[] storage degs = degrees[instituteAddress];
        string[] memory names = new string[](degs.length);
        uint256[] memory timestamps = new uint256[](degs.length);
        
        for (uint256 i = 0; i < degs.length; i++) {
            names[i] = degs[i].degree_name;
            timestamps[i] = degs[i].addedAt;
        }
        
        return (names, timestamps);
    }
    
    /**
     * @dev Get all departments
     */
    function getDepartments(address instituteAddress) 
        external 
        view 
        returns (string[] memory, uint256[] memory) 
    {
        Department[] storage depts = departments[instituteAddress];
        string[] memory names = new string[](depts.length);
        uint256[] memory timestamps = new uint256[](depts.length);
        
        for (uint256 i = 0; i < depts.length; i++) {
            names[i] = depts[i].department_name;
            timestamps[i] = depts[i].addedAt;
        }
        
        return (names, timestamps);
    }
    
    /**
     * @dev Get degrees count
     */
    function getDegreesCount(address instituteAddress) 
        external 
        view 
        returns (uint256) 
    {
        return degrees[instituteAddress].length;
    }
    
    /**
     * @dev Get departments count
     */
    function getDepartmentsCount(address instituteAddress) 
        external 
        view 
        returns (uint256) 
    {
        return departments[instituteAddress].length;
    }
    
    /**
     * @dev Get individual degree
     */
    function getDegree(address instituteAddress, uint256 index) 
        external 
        view 
        returns (string memory degreeName, uint256 addedAt) 
    {
        require(index < degrees[instituteAddress].length, "Index out of bounds");
        Degree storage degree = degrees[instituteAddress][index];
        return (degree.degree_name, degree.addedAt);
    }
    
    /**
     * @dev Get individual department
     */
    function getDepartment(address instituteAddress, uint256 index) 
        external 
        view 
        returns (string memory departmentName, uint256 addedAt) 
    {
        require(index < departments[instituteAddress].length, "Index out of bounds");
        Department storage department = departments[instituteAddress][index];
        return (department.department_name, department.addedAt);
    }
    
    /**
     * @dev Add single degree
     */
    function addDegree(address instituteAddress, string memory degreeName) 
        external 
        onlyInstitute(instituteAddress)
        validString(degreeName, 1)
    {
        require(!_degreeExists(instituteAddress, degreeName), "Degree already exists");
        uint256 index = _addDegree(instituteAddress, degreeName);
        emit DegreeAdded(instituteAddress, degreeName, index);
    }
    
    /**
     * @dev Add multiple degrees
     */
    function addDegrees(address instituteAddress, string[] memory degreeNames) 
        external 
        onlyInstitute(instituteAddress) 
    {
        require(degreeNames.length > 0, "No degrees provided");
        require(degreeNames.length <= 20, "Too many degrees at once");
        
        for (uint256 i = 0; i < degreeNames.length; i++) {
            require(bytes(degreeNames[i]).length > 0, "Degree name cannot be empty");
            require(!_degreeExists(instituteAddress, degreeNames[i]), "Degree already exists");
            uint256 index = _addDegree(instituteAddress, degreeNames[i]);
            emit DegreeAdded(instituteAddress, degreeNames[i], index);
        }
    }
    
    /**
     * @dev Add single department
     */
    function addDepartment(address instituteAddress, string memory departmentName) 
        external 
        onlyInstitute(instituteAddress)
        validString(departmentName, 1)
    {
        require(!_departmentExists(instituteAddress, departmentName), "Department already exists");
        uint256 index = _addDepartment(instituteAddress, departmentName);
        emit DepartmentAdded(instituteAddress, departmentName, index);
    }
    
    /**
     * @dev Add multiple departments
     */
    function addDepartments(address instituteAddress, string[] memory departmentNames) 
        external 
        onlyInstitute(instituteAddress) 
    {
        require(departmentNames.length > 0, "No departments provided");
        require(departmentNames.length <= 20, "Too many departments at once");
        
        for (uint256 i = 0; i < departmentNames.length; i++) {
            require(bytes(departmentNames[i]).length > 0, "Department name cannot be empty");
            require(!_departmentExists(instituteAddress, departmentNames[i]), "Department already exists");
            uint256 index = _addDepartment(instituteAddress, departmentNames[i]);
            emit DepartmentAdded(instituteAddress, departmentNames[i], index);
        }
    }
    
    /**
     * @dev Update institute name
     */
    function updateName(address instituteAddress, string memory newName) 
        external 
        onlyInstitute(instituteAddress)
        validString(newName, 1)
    {
        institutes[instituteAddress].name = newName;
        _updateTimestamp(instituteAddress);
        emit InstituteUpdated(instituteAddress, "name", block.timestamp);
    }
    
    /**
     * @dev Update institute address
     */
    function updateAddress(address instituteAddress, string memory newAddress) 
        external 
        onlyInstitute(instituteAddress)
        validString(newAddress, 1)
    {
        institutes[instituteAddress].addressLine = newAddress;
        _updateTimestamp(instituteAddress);
        emit InstituteUpdated(instituteAddress, "address", block.timestamp);
    }
    
    /**
     * @dev Update institute acronym
     */
    function updateAcronym(address instituteAddress, string memory newAcronym) 
        external 
        onlyInstitute(instituteAddress)
        validString(newAcronym, 1)
    {
        require(!usedAcronyms[newAcronym] || 
                keccak256(abi.encodePacked(newAcronym)) == 
                keccak256(abi.encodePacked(institutes[instituteAddress].acronym)), 
                "Acronym already used");
        
        // Free old acronym if changing to new one
        if (keccak256(abi.encodePacked(newAcronym)) != 
            keccak256(abi.encodePacked(institutes[instituteAddress].acronym))) {
            usedAcronyms[institutes[instituteAddress].acronym] = false;
            usedAcronyms[newAcronym] = true;
        }
        
        institutes[instituteAddress].acronym = newAcronym;
        _updateTimestamp(instituteAddress);
        emit InstituteUpdated(instituteAddress, "acronym", block.timestamp);
    }
    
    /**
     * @dev Update institute website
     */
    function updateWebsite(address instituteAddress, string memory newWebsite) 
        external 
        onlyInstitute(instituteAddress)
        validString(newWebsite, 1)
    {
        institutes[instituteAddress].website = newWebsite;
        _updateTimestamp(instituteAddress);
        emit InstituteUpdated(instituteAddress, "website", block.timestamp);
    }
    
    /**
     * @dev Update degree name
     */
    function updateDegree(address instituteAddress, uint256 index, string memory newDegreeName) 
        external 
        onlyInstitute(instituteAddress)
        validString(newDegreeName, 1)
    {
        require(index < degrees[instituteAddress].length, "Index out of bounds");
        require(!_degreeExists(instituteAddress, newDegreeName), "Degree already exists");
        
        degrees[instituteAddress][index].degree_name = newDegreeName;
        emit InstituteUpdated(instituteAddress, "degree", block.timestamp);
    }
    
    /**
     * @dev Update department name
     */
    function updateDepartment(address instituteAddress, uint256 index, string memory newDepartmentName) 
        external 
        onlyInstitute(instituteAddress)
        validString(newDepartmentName, 1)
    {
        require(index < departments[instituteAddress].length, "Index out of bounds");
        require(!_departmentExists(instituteAddress, newDepartmentName), "Department already exists");
        
        departments[instituteAddress][index].department_name = newDepartmentName;
        emit InstituteUpdated(instituteAddress, "department", block.timestamp);
    }
    
    /**
     * @dev Remove degree
     */
    function removeDegree(address instituteAddress, uint256 index) 
        external 
        onlyInstitute(instituteAddress) 
    {
        require(index < degrees[instituteAddress].length, "Index out of bounds");
        
        // Move last element to deleted spot
        uint256 lastIndex = degrees[instituteAddress].length - 1;
        if (index != lastIndex) {
            degrees[instituteAddress][index] = degrees[instituteAddress][lastIndex];
        }
        degrees[instituteAddress].pop();
        
        emit DegreeRemoved(instituteAddress, index);
    }
    
    /**
     * @dev Remove department
     */
    function removeDepartment(address instituteAddress, uint256 index) 
        external 
        onlyInstitute(instituteAddress) 
    {
        require(index < departments[instituteAddress].length, "Index out of bounds");
        
        uint256 lastIndex = departments[instituteAddress].length - 1;
        if (index != lastIndex) {
            departments[instituteAddress][index] = departments[instituteAddress][lastIndex];
        }
        departments[instituteAddress].pop();
        
        emit DepartmentRemoved(instituteAddress, index);
    }
    
    /**
     * @dev Clear all degrees
     */
    function clearDegrees(address instituteAddress) external onlyInstitute(instituteAddress) {
        delete degrees[instituteAddress];
        emit InstituteUpdated(instituteAddress, "degrees_cleared", block.timestamp);
    }
    
    /**
     * @dev Clear all departments
     */
    function clearDepartments(address instituteAddress) external onlyInstitute(instituteAddress) {
        delete departments[instituteAddress];
        emit InstituteUpdated(instituteAddress, "departments_cleared", block.timestamp);
    }
    
    /**
     * @dev Deactivate institute
     */
    function deactivateInstitute(address instituteAddress) external onlyOwner validAddress(instituteAddress) {
        require(institutes[instituteAddress].isActive, "Already inactive");
        institutes[instituteAddress].isActive = false;
        _updateTimestamp(instituteAddress);
        emit InstituteUpdated(instituteAddress, "deactivated", block.timestamp);
    }
    
    /**
     * @dev Reactivate institute
     */
    function reactivateInstitute(address instituteAddress) external onlyOwner validAddress(instituteAddress) {
        require(!institutes[instituteAddress].isActive, "Already active");
        institutes[instituteAddress].isActive = true;
        _updateTimestamp(instituteAddress);
        emit InstituteUpdated(instituteAddress, "reactivated", block.timestamp);
    }
    
    /**
     * @dev Search institute by name or acronym
     */
    function searchInstitute(string memory query) 
        external 
        view 
        returns (address[] memory, string[] memory, string[] memory) 
    {
        require(bytes(query).length >= 2, "Query too short");
        
        address[] memory foundAddresses = new address[](instituteAddresses.length);
        string[] memory names = new string[](instituteAddresses.length);
        string[] memory acronyms = new string[](instituteAddresses.length);
        
        uint256 count = 0;
        for (uint256 i = 0; i < instituteAddresses.length; i++) {
            address addr = instituteAddresses[i];
            Institute storage institute = institutes[addr];
            
            if (institute.isActive && 
                (_contains(institute.name, query) || _contains(institute.acronym, query))) {
                foundAddresses[count] = addr;
                names[count] = institute.name;
                acronyms[count] = institute.acronym;
                count++;
            }
        }
        
        // Resize arrays
        address[] memory resultAddresses = new address[](count);
        string[] memory resultNames = new string[](count);
        string[] memory resultAcronyms = new string[](count);
        
        for (uint256 i = 0; i < count; i++) {
            resultAddresses[i] = foundAddresses[i];
            resultNames[i] = names[i];
            resultAcronyms[i] = acronyms[i];
        }
        
        return (resultAddresses, resultNames, resultAcronyms);
    }
    
    // Internal helper functions
    function _addDegree(address instituteAddress, string memory degreeName) 
        private 
        returns (uint256) 
    {
        degrees[instituteAddress].push(Degree({
            degree_name: degreeName,
            addedAt: block.timestamp
        }));
        return degrees[instituteAddress].length - 1;
    }
    
    function _addDepartment(address instituteAddress, string memory departmentName) 
        private 
        returns (uint256) 
    {
        departments[instituteAddress].push(Department({
            department_name: departmentName,
            addedAt: block.timestamp
        }));
        return departments[instituteAddress].length - 1;
    }
    
    function _updateTimestamp(address instituteAddress) private {
        institutes[instituteAddress].lastUpdated = block.timestamp;
    }
    
    function _validateInstituteData(
        string memory name,
        string memory addressLine,
        string memory acronym,
        string memory website
    ) private pure {
        require(bytes(name).length >= 2, "Name too short");
        require(bytes(addressLine).length >= 5, "Address too short");
        require(bytes(acronym).length >= 2, "Acronym too short");
        require(bytes(acronym).length <= 10, "Acronym too long");
        require(bytes(website).length >= 5, "Website too short");
    }
    
    function _degreeExists(address instituteAddress, string memory degreeName) 
        private 
        view 
        returns (bool) 
    {
        Degree[] storage degs = degrees[instituteAddress];
        for (uint256 i = 0; i < degs.length; i++) {
            if (keccak256(abi.encodePacked(degs[i].degree_name)) == 
                keccak256(abi.encodePacked(degreeName))) {
                return true;
            }
        }
        return false;
    }
    
    function _departmentExists(address instituteAddress, string memory departmentName) 
        private 
        view 
        returns (bool) 
    {
        Department[] storage depts = departments[instituteAddress];
        for (uint256 i = 0; i < depts.length; i++) {
            if (keccak256(abi.encodePacked(depts[i].department_name)) == 
                keccak256(abi.encodePacked(departmentName))) {
                return true;
            }
        }
        return false;
    }
    
    function _contains(string memory str, string memory substr) 
        private 
        pure 
        returns (bool) 
    {
        bytes memory strBytes = bytes(str);
        bytes memory subBytes = bytes(substr);
        
        if (subBytes.length > strBytes.length) return false;
        
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