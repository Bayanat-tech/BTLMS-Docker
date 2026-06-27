import { FC, useState } from 'react';
import { Button, TextField } from '@mui/material';

export const SentBackPopup: FC<{
  request_number: string;
  flowLevel: number;
  onClose: () => void;
  onLevelChange: (level: number) => void;
  onRemarksChange: (remarks: string) => void;
}> = ({ request_number, flowLevel, onClose, onLevelChange, onRemarksChange }) => {
  const [remarks, setRemarks] = useState('');

  const handleOk = () => {
    if (!remarks.trim()) {
      alert('Remarks cannot be empty');
      return;
    }

    onLevelChange(flowLevel);
    onRemarksChange(remarks);
    onClose();
  };

  return (
    <div>
      <TextField label="Request Number" value={request_number} fullWidth disabled style={{ marginBottom: '20px' }} />
      <TextField label="Level" value={flowLevel} fullWidth disabled style={{ marginBottom: '20px' }} />
      <TextField
        label="Remarks"
        fullWidth
        multiline
        rows={4}
        value={remarks}
        onChange={(event) => setRemarks(event.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <div style={{ marginTop: '20px' }}>
        <Button onClick={handleOk} variant="contained" color="primary" style={{ marginRight: '10px' }}>
          OK
        </Button>
        <Button onClick={onClose} variant="contained" color="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
};
