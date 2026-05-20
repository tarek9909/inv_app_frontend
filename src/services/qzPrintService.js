import { api } from '../api/index.js';

const getQz = () => globalThis.qz;

export const qzPrintService = {
  isAvailable() {
    return Boolean(getQz()?.websocket);
  },
  async connect() {
    const qz = getQz();
    if (!qz) throw new Error('QZ Tray is not loaded. Install QZ Tray and include qz-tray.js.');
    qz.security.setCertificatePromise(async (resolve, reject) => {
      try {
        const result = await api.print.qz.certificate();
        resolve(result.data?.certificate || '');
      } catch (error) {
        reject(error);
      }
    });
    qz.security.setSignaturePromise((toSign) => async (resolve, reject) => {
      try {
        const result = await api.print.qz.sign(toSign);
        resolve(result.data?.signature || '');
      } catch (error) {
        reject(error);
      }
    });
    if (!qz.websocket.isActive()) await qz.websocket.connect();
    return qz;
  },
  async printRequest({ request, printerName }) {
    const qz = await this.connect();
    const printer = printerName || await qz.printers.getDefault();
    const config = qz.configs.create(printer);
    const lines = buildOrderLines(request);
    await qz.print(config, [{ type: 'raw', format: 'plain', data: lines.join('\n') }]);
    return { printer, qzVersion: qz.version || '' };
  },
  async testConnection() {
    const qz = await this.connect();
    return {
      active: qz.websocket.isActive(),
      version: qz.version || '',
      defaultPrinter: await qz.printers.getDefault().catch(() => '')
    };
  }
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const buildOrderLines = (request) => [
  'STOCK DRIVER ORDER',
  `Request: ${request.request_number}`,
  `Driver: ${request.driver?.full_name || '-'}`,
  `Date: ${request.request_date || '-'}`,
  `Status: ${request.request_status || '-'}`,
  '--------------------------------',
  ...(request.items || []).map((line) => `${line.item?.name || `Item #${line.item_id}`}  Qty: ${line.quantity}  Unit: ${money(line.unit_price)}  Total: ${money(Number(line.quantity || 0) * Number(line.unit_price || 0))}`),
  '--------------------------------',
  `Subtotal: ${money(request.subtotal)}`,
  `Discount: ${money(request.discount_amount)}`,
  `Total: ${money(request.total_amount)}`,
  `Paid: ${money(request.paid_amount)}`,
  `Remaining: ${money(request.remaining_amount)}`,
  request.notes ? `Notes: ${request.notes}` : '',
  '',
  'Driver signature: __________________',
  ''
].filter(Boolean);
