"use client";

import Swal from "sweetalert2";

export const showSuccess = (title: string, text: string) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#16a34a",
  });
};

export const showError = (title: string, text: string) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#dc2626",
  });
};

export const showWarning = (title: string, text: string) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonColor: "#f59e0b",
  });
};

export const showInfo = (title: string, text: string) => {
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonColor: "#2563eb",
  });
};

export const showConfirm = (title: string, text: string) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#dc2626",
    confirmButtonText: "Ya",
    cancelButtonText: "Batal",
  });
};
