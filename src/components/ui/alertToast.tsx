"use client";

import Swal from "sweetalert2";

// Base toast
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export const showToastSuccess = (title: string) => {
  return Toast.fire({
    icon: "success",
    title,
  });
};

export const showToastError = (title: string) => {
  return Toast.fire({
    icon: "error",
    title,
  });
};

export const showToastWarning = (title: string) => {
  return Toast.fire({
    icon: "warning",
    title,
  });
};

export const showToastInfo = (title: string) => {
  return Toast.fire({
    icon: "info",
    title,
  });
};
