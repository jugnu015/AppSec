import React, { useState, useEffect } from 'react';

const QR_BITS = [
  1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,
  1,0,1,0,1,1,0,1,0,0,1,1,0,1,0,0,1,1,0,0,1,
  1,0,1,0,1,0,1,0,1,0,0,1,1,0,1,0,1,0,1,0,1,
  0,1,0,1,0,1,0,0,0,1,0,0,1,0,0,1,0,1,0,1,0,
  1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,
  0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0,
  1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,0,1,0,1,0,1,
  0,1,0,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,0,1,0,
  1,0,1,1,0,0,1,0,1,0,1,1,0,0,1,0,1,1,0,0,1,
  0,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1,0,0,1,1,0,
  1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
];

const METHODS = [
  { id: 'upi',        label: 'UPI',        icon: '⚡' },
  { id: 'card',       label: 'Cards',      icon: '💳' },
  { id: 'netbanking', label: 'Netbanking', icon: '🏦' },
  { id: 'wallet',     label: 'Wallets',    icon: '👛' },
];

const BANKS = [
  'HDFC Bank', 'ICICI Bank', 'State Bank of India',
  'Axis Bank', 'Kotak Bank', 'Yes Bank',
];

const ALL_BANKS = [
  ...BANKS,
  'Punjab National Bank', 'Bank of Baroda',
  'Canara Bank', 'Union Bank of India',
];

const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik', 'Freecharge', 'Airtel Money'];

const fmt = amount =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

const fmtCard = v =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const fmtExpiry = v => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
};

export default function MockRazorpayModal({
  show,
  onClose,
  amount,
  merchantName,
  userName,
  onPaymentSuccess,
}) {
  const [method, setMethod]     = useState('upi');
  const [upiId, setUpiId]       = useState('');
  const [cardNo, setCardNo]     = useState('');
  const [cardName, setCardName] = useState(userName || '');
  const [expiry, setExpiry]     = useState('');
  const [cvv, setCvv]           = useState('');
  const [bank, setBank]         = useState('');
  const [wallet, setWallet]     = useState('');
  const [phase, setPhase]       = useState('form'); // 'form' | 'processing' | 'success'

  useEffect(() => {
    if (show) {
      setMethod('upi');
      setUpiId('');
      setCardNo('');
      setCardName(userName || '');
      setExpiry('');
      setCvv('');
      setBank('');
      setWallet('');
      setPhase('form');
    }
  }, [show, userName]);

  if (!show) return null;

  const handlePay = () => {
    setPhase('processing');
    setTimeout(() => {
      setPhase('success');
      setTimeout(onPaymentSuccess, 1400);
    }, 2200);
  };

  /* ─── overlay & shared layout ─── */
  const overlay = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.65)',
    zIndex: 10000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const card = {
    display: 'flex', borderRadius: 8, overflow: 'hidden',
    boxShadow: '0 10px 48px rgba(0,0,0,0.5)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    width: 780, maxWidth: '96vw', height: 560, maxHeight: '96vh',
  };

  /* ─── Processing / Success screens ─── */
  if (phase !== 'form') {
    return (
      <div style={overlay}>
        <div style={{ ...card, alignItems: 'center', justifyContent: 'center', background: '#fff', height: 300, width: 400 }}>
          {phase === 'processing' ? (
            <div style={{ textAlign: 'center' }}>
              <div className='spinner-border' style={{ color: '#3395ff', width: 52, height: 52 }} role='status' />
              <p style={{ marginTop: 20, fontSize: 16, color: '#444', fontWeight: 500 }}>Processing your payment…</p>
              <p style={{ fontSize: 12, color: '#aaa' }}>Please do not close this window</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#00BA88', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ color: '#fff', fontSize: 36, lineHeight: 1 }}>✓</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 4 }}>Payment Successful!</p>
              <p style={{ fontSize: 13, color: '#888' }}>Redirecting to your order…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── Main modal ─── */
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={card}>

        {/* ══════════ LEFT PANEL ══════════ */}
        <div style={{ width: 240, flexShrink: 0, background: '#1a1f2e', color: '#fff', display: 'flex', flexDirection: 'column' }}>

          {/* Razorpay branding */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, background: '#3395ff', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: -1 }}>R</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Razorpay</span>
            </div>
          </div>

          {/* Merchant info */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1.2 }}>Paying to</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{merchantName}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(amount)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              🔒 Secured by Razorpay
            </div>
          </div>

          {/* Payment method list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {METHODS.map(m => {
              const active = method === m.id;
              return (
                <div key={m.id} onClick={() => setMethod(m.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 20px', cursor: 'pointer',
                  background: active ? 'rgba(51,149,255,0.14)' : 'transparent',
                  borderLeft: active ? '3px solid #3395ff' : '3px solid transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all 0.12s',
                }}>
                  <span style={{ fontSize: 15 }}>{m.icon}</span>
                  {m.label}
                </div>
              );
            })}
          </div>

          <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Powered by Razorpay · Test Mode</span>
          </div>
        </div>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 12, color: '#aaa' }}>Test Payment Gateway</span>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#bbb', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>

          {/* Form area */}
          <div style={{ flex: 1, padding: '22px 28px', overflowY: 'auto' }}>

            {/* ── UPI ── */}
            {method === 'upi' && (
              <>
                <h6 style={{ fontWeight: 700, color: '#222', marginBottom: 4 }}>Pay via UPI</h6>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>Enter your UPI ID to complete payment</p>

                <label style={{ fontSize: 12, color: '#555', fontWeight: 600, display: 'block', marginBottom: 5 }}>UPI ID</label>
                <div style={{ display: 'flex', marginBottom: 6 }}>
                  <input
                    type='text' value={upiId} onChange={e => setUpiId(e.target.value)}
                    placeholder='yourname@upi'
                    style={{ flex: 1, padding: '10px 13px', border: '1.5px solid #ddd', borderRadius: '4px 0 0 4px', fontSize: 14, outline: 'none' }}
                  />
                  <button style={{ padding: '10px 16px', background: '#3395ff', color: '#fff', border: 'none', borderRadius: '0 4px 4px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Verify
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#bbb', marginBottom: 22 }}>e.g. 9876543210@ybl, name@okaxis</p>

                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 18, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: '#bbb', marginBottom: 12 }}>Or scan QR code</p>
                  <div style={{ width: 96, height: 96, border: '1.5px solid #ddd', borderRadius: 4, margin: '0 auto', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 1 }}>
                    {QR_BITS.map((b, i) => (
                      <div key={i} style={{ background: b ? '#222' : 'transparent', borderRadius: 1 }} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── CARD ── */}
            {method === 'card' && (
              <>
                <h6 style={{ fontWeight: 700, color: '#222', marginBottom: 4 }}>Credit / Debit Card</h6>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>All major cards accepted</p>

                {[
                  { label: 'Card Number', value: cardNo, onChange: e => setCardNo(fmtCard(e.target.value)), placeholder: '0000 0000 0000 0000', maxLength: 19, style: { letterSpacing: 2 } },
                  { label: 'Name on Card', value: cardName, onChange: e => setCardName(e.target.value), placeholder: 'Full name' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: '#555', fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input type='text' {...f} style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #ddd', borderRadius: 4, fontSize: 14, outline: 'none', ...(f.style || {}) }} />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#555', fontWeight: 600, display: 'block', marginBottom: 4 }}>Expiry Date</label>
                    <input type='text' maxLength={5} value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))} placeholder='MM/YY'
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #ddd', borderRadius: 4, fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#555', fontWeight: 600, display: 'block', marginBottom: 4 }}>CVV</label>
                    <input type='password' maxLength={4} value={cvv} onChange={e => setCvv(e.target.value)} placeholder='• • •'
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #ddd', borderRadius: 4, fontSize: 14, outline: 'none' }} />
                  </div>
                </div>
              </>
            )}

            {/* ── NETBANKING ── */}
            {method === 'netbanking' && (
              <>
                <h6 style={{ fontWeight: 700, color: '#222', marginBottom: 4 }}>Netbanking</h6>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>Select your bank</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  {BANKS.map(b => (
                    <div key={b} onClick={() => setBank(b)} style={{
                      padding: '10px 12px', border: `1.5px solid ${bank === b ? '#3395ff' : '#e5e5e5'}`,
                      borderRadius: 4, cursor: 'pointer', fontSize: 13,
                      color: bank === b ? '#3395ff' : '#555',
                      background: bank === b ? '#f0f7ff' : '#fff',
                      fontWeight: bank === b ? 600 : 400,
                    }}>{b}</div>
                  ))}
                </div>
                <label style={{ fontSize: 12, color: '#555', fontWeight: 600, display: 'block', marginBottom: 5 }}>Or choose from all banks</label>
                <select value={bank} onChange={e => setBank(e.target.value)}
                  style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #ddd', borderRadius: 4, fontSize: 14, outline: 'none', background: '#fff' }}>
                  <option value=''>Select Bank</option>
                  {ALL_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </>
            )}

            {/* ── WALLET ── */}
            {method === 'wallet' && (
              <>
                <h6 style={{ fontWeight: 700, color: '#222', marginBottom: 4 }}>Wallets</h6>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>Select your wallet</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {WALLETS.map(w => (
                    <div key={w} onClick={() => setWallet(w)} style={{
                      padding: '13px 12px', border: `1.5px solid ${wallet === w ? '#3395ff' : '#e5e5e5'}`,
                      borderRadius: 6, cursor: 'pointer', fontSize: 13, textAlign: 'center',
                      color: wallet === w ? '#3395ff' : '#555',
                      background: wallet === w ? '#f0f7ff' : '#fff',
                      fontWeight: wallet === w ? 600 : 400,
                    }}>{w}</div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pay button */}
          <div style={{ padding: '14px 28px', borderTop: '1px solid #f0f0f0' }}>
            <button onClick={handlePay} style={{
              width: '100%', padding: '13px',
              background: '#3395ff', color: '#fff',
              border: 'none', borderRadius: 4,
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.4,
            }}>
              PAY {fmt(amount)}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
