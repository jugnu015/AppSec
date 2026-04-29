import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useGetUserProfileQuery } from '../slices/usersApiSlice';
import Loader from './Loader';

const AdminRoute = () => {
  // Secure check: Fetch the real user profile from the backend
  const { data: userProfile, isLoading } = useGetUserProfileQuery();

  if (isLoading) return <Loader />;

  return userProfile && userProfile.isAdmin ? (
    <Outlet />
  ) : (
    <Navigate to='/admin/login' replace />
  );
};

export default AdminRoute;
