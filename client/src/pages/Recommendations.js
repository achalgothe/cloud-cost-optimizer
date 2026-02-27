import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  DataGrid,
} from '@mui/x-data-grid';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { recommendationService } from '../services';

const Recommendations = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedRec, setSelectedRec] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [filter]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await recommendationService.getAll(params);
      setRecommendations(response.data.recommendations);
      setSummary(response.data.summary);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      await recommendationService.generate();
      await fetchRecommendations();
    } catch (err) {
      setError('Failed to generate recommendations');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await recommendationService.update(id, { status, notes });
      setDialogOpen(false);
      await fetchRecommendations();
    } catch (err) {
      setError('Failed to update recommendation');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recommendation?')) {
      try {
        await recommendationService.delete(id);
        await fetchRecommendations();
      } catch (err) {
        setError('Failed to delete recommendation');
        console.error(err);
      }
    }
  };

  const openDialog = (rec) => {
    setSelectedRec(rec);
    setNotes(rec.notes || '');
    setDialogOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      rightsizing: 'Rightsizing',
      reserved_instances: 'Reserved Instances',
      spot_instances: 'Spot Instances',
      idle_resources: 'Idle Resources',
      storage_optimization: 'Storage',
      savings_plan: 'Savings Plan',
      architecture: 'Architecture',
    };
    return labels[category] || category;
  };

  const columns = [
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'title',
      headerName: 'Recommendation',
      width: 300,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="500">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {getCategoryLabel(params.row.category)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'estimatedSavings',
      headerName: 'Est. Savings',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="success.main" fontWeight="600">
          ${(parseFloat(params.value) || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'savingsPercentage',
      headerName: 'Savings %',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2">
          {(parseFloat(params.value) || 0).toFixed(0)}%
        </Typography>
      ),
    },
    {
      field: 'aiConfidence',
      headerName: 'AI Confidence',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
          <Typography variant="body2">
            {(parseFloat(params.value) || 0).toFixed(0)}%
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'implemented' ? 'success' : 'default'}
          variant={params.value === 'pending' ? 'outlined' : 'filled'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => openDialog(params.row)}
            color="primary"
          >
            <CheckIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row._id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">AI Recommendations</Typography>
        <Button
          variant="contained"
          startIcon={generating ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate New'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total
              </Typography>
              <Typography variant="h4">{summary?.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                High Priority
              </Typography>
              <Typography variant="h4" color="error.main">
                {summary?.byPriority?.high || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {summary?.byStatus?.pending || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Implemented
              </Typography>
              <Typography variant="h4" color="success.main">
                {summary?.byStatus?.implemented || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Est. Savings
              </Typography>
              <Typography variant="h5" color="success.main">
                ${summary?.totalEstimatedSavings?.toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filter}
            label="Filter"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="implemented">Implemented</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="dismissed">Dismissed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Recommendations Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={recommendations.map((r) => ({ ...r, id: r._id }))}
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

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Recommendation</DialogTitle>
        <DialogContent>
          {selectedRec && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedRec.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedRec.description}
              </Typography>
              <Typography variant="body1" color="success.main" sx={{ mb: 2 }}>
                Estimated Savings: ${selectedRec.estimatedSavings?.toFixed(2)} ({selectedRec.savingsPercentage}%)
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedRec.status}
                  label="Status"
                  onChange={(e) =>
                    setSelectedRec({ ...selectedRec, status: e.target.value })
                  }
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="implemented">Implemented</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="dismissed">Dismissed</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this recommendation..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleStatusUpdate(selectedRec?._id, selectedRec?.status)}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recommendations;
