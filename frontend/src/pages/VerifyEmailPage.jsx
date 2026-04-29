import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useVerifyEmailMutation } from '../slices/usersApiSlice';
import { toast } from 'react-toastify';
import { Row, Col, Card, Button } from 'react-bootstrap';
import Loader from '../components/Loader';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verifyEmail, { isLoading, isSuccess, isError, error }] = useVerifyEmailMutation();

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail({ token }).unwrap();
        toast.success('Email verified successfully! You can now log in.');
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'Failed to verify email');
      }
    };
    if (token) {
      verify();
    }
  }, [token, verifyEmail]);

  return (
    <Row className="justify-content-md-center mt-5">
      <Col xs={12} md={6}>
        <Card className="text-center p-4">
          <h2>Email Verification</h2>
          {isLoading && <Loader />}
          {isSuccess && (
            <div>
              <p className="text-success mt-3">Your email has been successfully verified.</p>
              <Button as={Link} to="/login" variant="primary" className="mt-3">
                Go to Login
              </Button>
            </div>
          )}
          {isError && (
            <div>
              <p className="text-danger mt-3">
                {error?.data?.message || 'Verification failed. The link may be invalid or expired.'}
              </p>
              <Button as={Link} to="/login" variant="secondary" className="mt-3">
                Back to Login
              </Button>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default VerifyEmailPage;
