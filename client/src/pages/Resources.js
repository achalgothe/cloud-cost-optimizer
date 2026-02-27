import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import CloudIcon from '@mui/icons-material/Cloud';
import MuiAlert from '@mui/material/Alert';
import { resourceService } from '../services';

const Resources = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resources, setResources] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    cloudProvider: 'aws',
    resourceType: 'EC2',
    resourceName: '',
    resourceId: '',
    region: '',
    status: 'running',
    cost: '',
    specifications: { vcpu: '', memory: '', storage: '' },
  });

  useEffect(() => {
    fetchResources();
  }, [filterStatus, filterProvider]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterProvider !== 'all') params.provider = filterProvider;
      if (search) params.search = search;

      const response = await resourceService.getAll(params);
      setResources(response.data.resources);
      setSummary(response.data.summary);
    } catch (err) {
      setError('Failed to load resources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchResources();
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      cloudProvider: 'aws',
      resourceType: 'EC2',
      resourceName: '',
      resourceId: '',
      region: '',
      status: 'running',
      cost: '',
      specifications: { vcpu: '', memory: '', storage: '' },
    });
  };

  const handleCreate = async () => {
    try {
      await resourceService.create(formData);
      setSnackbar({ open: true, message: 'Resource created successfully!', severity: 'success' });
      handleCloseDialog();
      fetchResources();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to create resource', severity: 'error' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      running: 'success',
      stopped: 'default',
      idle: 'warning',
      underutilized: 'info',
      optimal: 'success',
    };
    return colors[status] || 'default';
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'aws':
        return <CloudIcon fontSize="small" />;
      case 'azure':
        return <StorageIcon fontSize="small" />;
      case 'gcp':
        return <MemoryIcon fontSize="small" />;
      default:
        return <CloudIcon fontSize="small" />;
    }
  };

  const columns = [
    {
      field: 'cloudProvider',
      headerName: 'Provider',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getProviderIcon(params.value)}
          <Typography variant="body2" sx={{ ml: 0.5, textTransform: 'uppercase' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'resourceName',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="500">
            {params.value || params.row.resourceType}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.resourceId}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'resourceType',
      headerName: 'Type',
      width: 150,
    },
    {
      field: 'region',
      headerName: 'Region',
      width: 100,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'utilization',
      headerName: 'CPU Util.',
      width: 120,
      renderCell: (params) => {
        const cpu = params.row.utilization?.cpu || 0;
        let color = 'success.main';
        if (cpu < 20) color = 'warning.main';
        if (cpu < 10) color = 'error.main';
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 60,
                height: 6,
                bgcolor: '#e0e0e0',
                borderRadius: 3,
                mr: 1,
              }}
            >
              <Box
                sx={{
                  width: `${cpu}%`,
                  height: '100%',
                  bgcolor: color,
                  borderRadius: 3,
                }}
              />
            </Box>
            <Typography variant="body2">{parseFloat(cpu).toFixed(0)}%</Typography>
          </Box>
        );
      },
    },
    {
      field: 'cost',
      headerName: 'Monthly Cost',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="600">
          ${(parseFloat(params.value) || 0).toFixed(2)}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Cloud Resources
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          color="primary"
        >
          Add Resource
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Resources
              </Typography>
              <Typography variant="h4">{summary?.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Running
              </Typography>
              <Typography variant="h4" color="success.main">
                {summary?.byStatus?.running || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Idle
              </Typography>
              <Typography variant="h4" color="warning.main">
                {summary?.byStatus?.idle || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Underutilized
              </Typography>
              <Typography variant="h4" color="info.main">
                {summary?.byStatus?.underutilized || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Cost
              </Typography>
              <Typography variant="h5" color="error.main">
                ${summary?.totalCost?.toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch} size="small">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="idle">Idle</MenuItem>
                  <MenuItem value="underutilized">Underutilized</MenuItem>
                  <MenuItem value="optimal">Optimal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Provider</InputLabel>
                <Select
                  value={filterProvider}
                  label="Provider"
                  onChange={(e) => setFilterProvider(e.target.value)}
                >
                  <MenuItem value="all">All Providers</MenuItem>
                  <MenuItem value="aws">AWS</MenuItem>
                  <MenuItem value="azure">Azure</MenuItem>
                  <MenuItem value="gcp">GCP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={resources.map((r) => ({ ...r, id: r._id }))}
              columns={columns}
              autoHeight
              hideFooterPagination
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e0',
                },
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Resource Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Resource</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Cloud Provider</InputLabel>
                <Select
                  name="cloudProvider"
                  value={formData.cloudProvider}
                  label="Cloud Provider"
                  onChange={handleInputChange}
                >
                  <MenuItem value="aws">AWS</MenuItem>
                  <MenuItem value="azure">Azure</MenuItem>
                  <MenuItem value="gcp">GCP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                name="resourceType"
                label="Resource Type"
                value={formData.resourceType}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                name="resourceName"
                label="Resource Name"
                value={formData.resourceName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                name="resourceId"
                label="Resource ID"
                value={formData.resourceId}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                name="region"
                label="Region"
                value={formData.region}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange}
                >
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="idle">Idle</MenuItem>
                  <MenuItem value="underutilized">Underutilized</MenuItem>
                  <MenuItem value="optimal">Optimal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                name="cost"
                label="Monthly Cost ($)"
                type="number"
                value={formData.cost}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                name="specifications.vcpu"
                label="vCPU"
                value={formData.specifications.vcpu}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                name="specifications.memory"
                label="Memory (GB)"
                value={formData.specifications.memory}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                name="specifications.storage"
                label="Storage (GB)"
                value={formData.specifications.storage}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create Resource</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Resources;
