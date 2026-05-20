export const createPrintApi = (client) => ({
  qz: {
    certificate: () => client.get('/print/qz/certificate'),
    sign: (request) => client.post('/print/qz/sign', { request })
  }
});
