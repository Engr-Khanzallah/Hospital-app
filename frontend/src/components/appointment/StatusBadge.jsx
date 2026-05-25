const StatusBadge = ({ status }) => {
  const config = {
    pending: { cls: 'badge-pending', label: 'Pending' },
    confirmed: { cls: 'badge-confirmed', label: 'Confirmed' },
    completed: { cls: 'badge-completed', label: 'Completed' },
    cancelled: { cls: 'badge-cancelled', label: 'Cancelled' }
  };
  const { cls, label } = config[status] || config.pending;
  return <span className={cls}>{label}</span>;
};

export default StatusBadge;
