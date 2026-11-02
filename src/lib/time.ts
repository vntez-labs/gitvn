import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  return dayjs(dateString).fromNow();
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  return dayjs(dateString).format('HH:mm - DD/MM/YYYY');
}
