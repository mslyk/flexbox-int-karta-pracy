
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      studentName,
      studentClass,
      startTime,
      endTime,
      tasks,
      log
    } = req.body;

    const esc = (value = '') =>
      String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');

    const tasksHtml = (tasks || []).map((task, index) => `
      <h3>Zadanie ${index + 1}</h3>
      <pre style="
        background:#f3f7fc;
        border:1px solid #d7e3f1;
        padding:12px;
        border-radius:8px;
        white-space:pre-wrap;
      ">${esc(task)}</pre>
    `).join('');

    const logHtml = (log || []).map(event => `
      <tr>
        <td style="border:1px solid #d7e3f1;padding:6px;">
          ${esc(event.time)}
        </td>
        <td style="border:1px solid #d7e3f1;padding:6px;">
          ${esc(event.type)}
        </td>
        <td style="border:1px solid #d7e3f1;padding:6px;">
          ${esc(event.details)}
        </td>
      </tr>
    `).join('');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Flexbox WIAI <onboarding@resend.dev>',

        to: ['magdalena.slyk@zstil.pl'],

        subject: `Flexbox – ${studentName} – ${studentClass}`,

        html: `
          <div style="font-family:Arial,sans-serif;max-width:900px;margin:auto;">
            <h1 style="color:#1d4ed8;">Flexbox – praca ucznia</h1>

            <p><strong>Uczeń:</strong> ${esc(studentName)}</p>
            <p><strong>Klasa:</strong> ${esc(studentClass)}</p>
            <p><strong>Rozpoczęcie:</strong> ${esc(startTime)}</p>
            <p><strong>Zakończenie:</strong> ${esc(endTime)}</p>

            <hr>

            <h2>Rozwiązania</h2>
            ${tasksHtml}

            <hr>

            <h2>Raport aktywności</h2>

            <table style="border-collapse:collapse;width:100%;">
              <thead>
                <tr>
                  <th style="border:1px solid #d7e3f1;padding:6px;">Czas</th>
                  <th style="border:1px solid #d7e3f1;padding:6px;">Zdarzenie</th>
                  <th style="border:1px solid #d7e3f1;padding:6px;">Szczegóły</th>
                </tr>
              </thead>
              <tbody>
                ${logHtml}
              </tbody>
            </table>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({
        error: 'Nie udało się wysłać wiadomości',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      id: data.id
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Błąd serwera'
    });
  }
}
