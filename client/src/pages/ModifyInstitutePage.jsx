// ModifyInstitutePage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  CleaningServices as ClearIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ethers } from 'ethers';
import INSTITUTION_ABI from '../contracts/Institution.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_INSTITUTION_CONTRACT_ADDRESS;

const ModifyInstitutePage = () => {
  // Wallet / contract
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [caller, setCaller] = useState('');
  const [contract, setContract] = useState(null);

  // Institute meta
  const [instName, setInstName] = useState('');
  const [instAddr, setInstAddr] = useState('');
  const [instAcr, setInstAcr] = useState('');
  const [instLink, setInstLink] = useState('');

  // Lists (rendered as simple string arrays)
  const [degrees, setDegrees] = useState([]); // ["BSc", "MSc", ...]
  const [departments, setDepartments] = useState([]); // ["CSE", "EEE", ...]

  // UI states
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Add inputs
  const [newDegree, setNewDegree] = useState('');
  const [newDegreeCsv, setNewDegreeCsv] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newDeptCsv, setNewDeptCsv] = useState('');

  // Inline edit states
  const [editDegIndex, setEditDegIndex] = useState(null);
  const [editDegName, setEditDegName] = useState('');
  const [editDeptIndex, setEditDeptIndex] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');

  const csvToList = useCallback(
    csv =>
      csv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    []
  );

  // Initialize provider/signer/contract
  useEffect(() => {
    (async () => {
      try {
        if (!window.ethereum) {
          setErr('MetaMask is not available in this browser.');
          return;
        }
        if (!CONTRACT_ADDRESS) {
          setErr('VITE_INSTITUTION_CONTRACT_ADDRESS is not set.');
          return;
        }

        const _provider = new ethers.BrowserProvider(window.ethereum);
        await _provider.send('eth_requestAccounts', []);
        const _signer = await _provider.getSigner();
        const _caller = await _signer.getAddress();

        const code = await _provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
          setErr(
            'No contract found at the configured address (wrong network or bad address).'
          );
          return;
        }

        const _contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          INSTITUTION_ABI.abi,
          _signer
        );

        setProvider(_provider);
        setSigner(_signer);
        setCaller(_caller);
        setContract(_contract);
      } catch (e) {
        console.error(e);
        setErr(
          e?.shortMessage ||
            e?.message ||
            'Failed to initialize wallet/contract.'
        );
      }
    })();
  }, []);

  const checkRegistered = useCallback(async () => {
    if (!contract || !caller) return false;
    try {
      return await contract.checkInstitutePermission(caller);
    } catch (e) {
      console.error(e);
      setErr('Failed to verify institute registration.');
      return false;
    }
  }, [contract, caller]);

  const mapDegrees = useCallback(degArray => {
    return (degArray || []).map(d => d?.degree_name ?? d?.[0] ?? String(d));
  }, []);

  const mapDepartments = useCallback(deptArray => {
    return (deptArray || []).map(
      d => d?.department_name ?? d?.[0] ?? String(d)
    );
  }, []);

  const loadInstituteData = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const registered = await checkRegistered();
      if (!registered) {
        setErr('This wallet is not a registered institute.');
        setLoading(false);
        return;
      }

      const res = await contract.getInstituteData();
      const name = res?.[0] ?? res?.institute_name ?? '';
      const addr = res?.[1] ?? res?.institute_address ?? '';
      const acr = res?.[2] ?? res?.institute_acronym ?? '';
      const link = res?.[3] ?? res?.institute_link ?? '';
      const degs = mapDegrees(res?.[4]);
      const depts = mapDepartments(res?.[5]);

      setInstName(name);
      setInstAddr(addr);
      setInstAcr(acr);
      setInstLink(link);
      setDegrees(degs);
      setDepartments(depts);
    } catch (e) {
      console.error(e);
      const m = e?.info?.error?.message || e?.shortMessage || e?.message || '';
      if (m.includes('Institute account does not exist')) {
        setErr('Institute account does not exist for this wallet.');
      } else {
        setErr('Failed to load institute data.');
      }
    } finally {
      setLoading(false);
    }
  }, [contract, checkRegistered, mapDegrees, mapDepartments]);

  useEffect(() => {
    if (contract) {
      loadInstituteData();
    }
  }, [contract, loadInstituteData]);

  // --- Actions: Degrees ---
  const addDegree = async () => {
    if (!newDegree.trim()) {
      setErr('Enter a degree name.');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.addDegrees([newDegree.trim()]);
      await tx.wait();
      setMsg('Degree added.');
      setNewDegree('');
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to add degree.');
    } finally {
      setLoading(false);
    }
  };

  const addDegreeCsv = async () => {
    const list = csvToList(newDegreeCsv);
    if (!list.length) {
      setErr('Enter comma-separated degree names.');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.addDegrees(list);
      await tx.wait();
      setMsg('Degrees added.');
      setNewDegreeCsv('');
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to add degrees.');
    } finally {
      setLoading(false);
    }
  };

  const startEditDegree = idx => {
    setEditDegIndex(idx);
    setEditDegName(degrees[idx] ?? '');
  };

  const cancelEditDegree = () => {
    setEditDegIndex(null);
    setEditDegName('');
  };

  const saveEditDegree = async () => {
    if (editDegIndex === null) return;
    const name = editDegName.trim();
    if (!name) {
      setErr('Degree name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.updateDegree(editDegIndex, name);
      await tx.wait();
      setMsg('Degree updated.');
      cancelEditDegree();
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to update degree.');
    } finally {
      setLoading(false);
    }
  };

  const deleteDegree = async idx => {
    setLoading(true);
    try {
      const tx = await contract.removeDegree(idx);
      await tx.wait();
      setMsg('Degree removed.');
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to remove degree.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllDegrees = async () => {
    if (!confirm('Clear ALL degrees? This cannot be undone.')) return;
    setLoading(true);
    try {
      const tx = await contract.clearDegrees();
      await tx.wait();
      setMsg('All degrees cleared.');
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to clear degrees.');
    } finally {
      setLoading(false);
    }
  };

  // --- Actions: Departments ---
  const addDept = async () => {
    if (!newDept.trim()) {
      setErr('Enter a department name.');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.addDepartments([newDept.trim()]);
      await tx.wait();
      setMsg('Department added.');
      setNewDept('');
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to add department.');
    } finally {
      setLoading(false);
    }
  };

  const addDeptCsv = async () => {
    const list = csvToList(newDeptCsv);
    if (!list.length) {
      setErr('Enter comma-separated department names.');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.addDepartments(list);
      await tx.wait();
      setMsg('Departments added.');
      setNewDeptCsv('');
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to add departments.');
    } finally {
      setLoading(false);
    }
  };

  const startEditDept = idx => {
    setEditDeptIndex(idx);
    setEditDeptName(departments[idx] ?? '');
  };

  const cancelEditDept = () => {
    setEditDeptIndex(null);
    setEditDeptName('');
  };

  const saveEditDept = async () => {
    if (editDeptIndex === null) return;
    const name = editDeptName.trim();
    if (!name) {
      setErr('Department name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.updateDepartment(editDeptIndex, name);
      await tx.wait();
      setMsg('Department updated.');
      cancelEditDept();
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to update department.');
    } finally {
      setLoading(false);
    }
  };

  const deleteDept = async idx => {
    setLoading(true);
    try {
      const tx = await contract.removeDepartment(idx);
      await tx.wait();
      setMsg('Department removed.');
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to remove department.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllDepts = async () => {
    if (!confirm('Clear ALL departments? This cannot be undone.')) return;
    setLoading(true);
    try {
      const tx = await contract.clearDepartments();
      await tx.wait();
      setMsg('All departments cleared.');
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || 'Failed to clear departments.');
    } finally {
      setLoading(false);
    }
  };

  // NEW state near your other useState hooks
  const [edit, setEdit] = useState({
    name: false,
    addr: false,
    acr: false,
    link: false,
  });
  const [draft, setDraft] = useState({ name: '', addr: '', acr: '', link: '' });
  const startEdit = (key, value) => {
    setEdit(prev => ({ ...prev, [key]: true }));
    setDraft(prev => ({ ...prev, [key]: value ?? '' }));
  };
  const cancelEdit = key => setEdit(prev => ({ ...prev, [key]: false }));

  // Try-call a contract method if it exists in the ABI
  const callIfExists = async (fnName, arg) => {
    try {
      contract.interface.getFunction(fnName); // throws if missing in ABI
      const tx = await contract[fnName](arg);
      await tx.wait();
      return true;
    } catch (e) {
      return false;
    }
  };

  // Save per-field
  const saveField = async (key, label) => {
    const val = (draft[key] || '').trim();
    if (!val) {
      setErr(`${label} cannot be empty.`);
      return;
    }
    setLoading(true);
    try {
      let ok = false;
      if (key === 'name') {
        const tx = await contract.updateInstituteName(val);
        await tx.wait();
        ok = true;
      } else if (key === 'addr') {
        ok = await callIfExists('updateInstituteAddress', val);
      } else if (key === 'acr') {
        ok = await callIfExists('updateInstituteAcronym', val);
      } else if (key === 'link') {
        ok = await callIfExists('updateInstituteLink', val);
      }

      if (!ok) {
        setErr(
          `Contract does not expose an updater for ${label}. Add it on-chain first.`
        );
        return;
      }

      setMsg(`${label} updated.`);
      cancelEdit(key);
      await loadInstituteData();
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || `Failed to update ${label}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Modify Institute
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="subtitle1">Wallet</Typography>
          <Button
            variant="text"
            startIcon={<RefreshIcon />}
            onClick={loadInstituteData}
          >
            Refresh
          </Button>
        </Stack>
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
          {caller || '-'}
        </Typography>
      </Paper>

      {loading && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Working…</Typography>
        </Stack>
      )}

      {/* Institute Meta */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Institute Info
        </Typography>

        {/* Name */}
        {!edit.name ? (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              label="Name"
              value={instName}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <Button onClick={() => startEdit('name', instName)}>Edit</Button>
          </Stack>
        ) : (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Name"
              value={draft.name}
              onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => saveField('name', 'Name')}
            >
              Save
            </Button>
            <Button onClick={() => cancelEdit('name')}>Cancel</Button>
          </Stack>
        )}

        {/* Address */}
        {!edit.addr ? (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              label="Address"
              value={instAddr}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <Button onClick={() => startEdit('addr', instAddr)}>Edit</Button>
          </Stack>
        ) : (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Address"
              value={draft.addr}
              onChange={e => setDraft(p => ({ ...p, addr: e.target.value }))}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => saveField('addr', 'Address')}
            >
              Save
            </Button>
            <Button onClick={() => cancelEdit('addr')}>Cancel</Button>
          </Stack>
        )}

        {/* Acronym */}
        {!edit.acr ? (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              label="Acronym"
              value={instAcr}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <Button onClick={() => startEdit('acr', instAcr)}>Edit</Button>
          </Stack>
        ) : (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <TextField
              label="Acronym"
              value={draft.acr}
              onChange={e => setDraft(p => ({ ...p, acr: e.target.value }))}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => saveField('acr', 'Acronym')}
            >
              Save
            </Button>
            <Button onClick={() => cancelEdit('acr')}>Cancel</Button>
          </Stack>
        )}

        {/* Website */}
        {!edit.link ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Website"
              value={instLink}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <Button onClick={() => startEdit('link', instLink)}>Edit</Button>
          </Stack>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Website"
              value={draft.link}
              onChange={e => setDraft(p => ({ ...p, link: e.target.value }))}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => saveField('link', 'Website')}
            >
              Save
            </Button>
            <Button onClick={() => cancelEdit('link')}>Cancel</Button>
          </Stack>
        )}
      </Paper>

      {/* Degrees Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="h6">Degrees</Typography>
          <Button
            color="error"
            startIcon={<ClearIcon />}
            onClick={clearAllDegrees}
          >
            Clear All
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            label="New Degree"
            value={newDegree}
            onChange={e => setNewDegree(e.target.value)}
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addDegree}
          >
            Add
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            label="Add Multiple (CSV)"
            placeholder="BSc, MSc, PhD"
            value={newDegreeCsv}
            onChange={e => setNewDegreeCsv(e.target.value)}
            fullWidth
          />
          <Button variant="outlined" onClick={addDegreeCsv}>
            Add CSV
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          {degrees.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No degrees yet.
            </Typography>
          )}
          {degrees.map((deg, idx) => (
            <Paper key={`deg-${idx}`} sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="body2"
                  sx={{ width: 28, textAlign: 'right', mr: 1 }}
                >
                  {idx}
                </Typography>

                {editDegIndex === idx ? (
                  <>
                    <TextField
                      size="small"
                      value={editDegName}
                      onChange={e => setEditDegName(e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <IconButton onClick={saveEditDegree} title="Save">
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={cancelEditDegree} title="Cancel">
                      <CloseIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {deg}
                    </Typography>
                    <IconButton
                      onClick={() => startEditDegree(idx)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => deleteDegree(idx)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* Departments Section */}
      <Paper sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="h6">Departments</Typography>
          <Button
            color="error"
            startIcon={<ClearIcon />}
            onClick={clearAllDepts}
          >
            Clear All
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            label="New Department"
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
            fullWidth
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={addDept}>
            Add
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            label="Add Multiple (CSV)"
            placeholder="CSE, EEE"
            value={newDeptCsv}
            onChange={e => setNewDeptCsv(e.target.value)}
            fullWidth
          />
          <Button variant="outlined" onClick={addDeptCsv}>
            Add CSV
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          {departments.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No departments yet.
            </Typography>
          )}
          {departments.map((dept, idx) => (
            <Paper key={`dept-${idx}`} sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="body2"
                  sx={{ width: 28, textAlign: 'right', mr: 1 }}
                >
                  {idx}
                </Typography>

                {editDeptIndex === idx ? (
                  <>
                    <TextField
                      size="small"
                      value={editDeptName}
                      onChange={e => setEditDeptName(e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <IconButton onClick={saveEditDept} title="Save">
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={cancelEditDept} title="Cancel">
                      <CloseIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {dept}
                    </Typography>
                    <IconButton onClick={() => startEditDept(idx)} title="Edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => deleteDept(idx)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* Snackbars */}
      <Snackbar
        open={!!msg}
        message={msg}
        autoHideDuration={4000}
        onClose={() => setMsg('')}
      />
      <Snackbar
        open={!!err}
        message={err}
        autoHideDuration={6000}
        onClose={() => setErr('')}
      />
    </Box>
  );
};

export default ModifyInstitutePage;
