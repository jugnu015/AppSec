import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useVerifyMfaMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-toastify';
import FormContainer from '../components/FormContainer';
import Loader from '../components/Loader';
import Meta from '../components/Meta';

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 600; // must match backend (10 minutes)

const MfaPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userId = state?.userId;
  const redirect = state?.redirect || '/';
  const remember = state?.remember || false;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const inputRefs = useRef([]);

  const [verifyMfa, { isLoading }] = useVerifyMfaMutation();

  // Redirect to login if arrived without userId (direct navigation)
  useEffect(() => {
    if (!userId) navigate('/login');
  }, [userId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const formatTime = s => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = e => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    const next = [...otp];
    digits.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const submitHandler = async e => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    try {
      const res = await verifyMfa({ userId, otp: code, remember }).unwrap();
      dispatch(setCredentials({ ...res }));
      toast.success('Login successful!');
      navigate(redirect);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
      // Clear OTP boxes on wrong code so user can re-enter cleanly
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const expired = timeLeft <= 0;

  return (
    <FormContainer>
      <Meta title='Verify Login' />
      <h1 className='mb-1'>Two-Step Verification</h1>
      <p className='text-muted mb-4' style={{ fontSize: 14 }}>
        A 6-digit code was sent to your email address. Enter it below to sign in.
      </p>

      <Form onSubmit={submitHandler}>
        {/* OTP digit boxes */}
        <div className='d-flex justify-content-between gap-2 mb-3'>
          {otp.map((digit, i) => (
            <Form.Control
              key={i}
              ref={el => (inputRefs.current[i] = el)}
              type='text'
              inputMode='numeric'
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={expired || isLoading}
              style={{
                width: 48,
                height: 56,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 700,
                borderRadius: 6,
                border: `2px solid ${digit ? '#ffc107' : '#ccc'}`,
                outline: 'none',
                caretColor: 'transparent',
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className='text-center mb-4'>
          {expired ? (
            <span className='text-danger' style={{ fontSize: 13 }}>
              Code expired.{' '}
              <Link to={redirect.includes('admin') ? '/admin/login' : '/login'} style={{ color: '#dc3545' }}>
                Log in again
              </Link>
            </span>
          ) : (
            <span style={{ fontSize: 13, color: timeLeft < 60 ? '#dc3545' : '#6c757d' }}>
              Code expires in <strong>{formatTime(timeLeft)}</strong>
            </span>
          )}
        </div>

        <Button
          type='submit'
          variant='warning'
          className='w-100 mb-3'
          disabled={isLoading || expired || otp.join('').length < OTP_LENGTH}
        >
          {isLoading ? <Loader /> : 'Verify & Sign In'}
        </Button>
      </Form>

      <div className='text-center' style={{ fontSize: 13, color: '#6c757d' }}>
        Didn't receive the code?{' '}
        <Link to={redirect.includes('admin') ? '/admin/login' : '/login'}>Go back and try again</Link>
      </div>
    </FormContainer>
  );
};

export default MfaPage;
