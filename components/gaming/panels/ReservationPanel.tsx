/**
 * Reservation Management Panel
 */

import React, { useState, useEffect } from 'react';
import { Reservation } from '../../../gaming-types';
import { reservationService } from '../../../services/reservationService';

const ReservationPanel: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    const data = await reservationService.getTodayReservations();
    setReservations(data);
  };

  const confirmReservation = async (id: string) => {
    await reservationService.confirmReservation(id);
    loadReservations();
  };

  const cancelReservation = async (id: string) => {
    if (confirm('Cancel this reservation?')) {
      await reservationService.cancelReservation(id, 'Cancelled by admin');
      loadReservations();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Reservations - Today</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations.map(reservation => (
          <div key={reservation.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold">{reservation.userName}</p>
                <p className="text-sm text-gray-400">{reservation.clientId}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                reservation.status === 'pending' ? 'bg-yellow-600' :
                reservation.status === 'confirmed' ? 'bg-green-600' :
                reservation.status === 'cancelled' ? 'bg-red-600' : 'bg-gray-600'
              }`}>
                {reservation.status}
              </span>
            </div>

            <div className="space-y-1 text-sm mb-3">
              <p>📅 {new Date(reservation.startTime).toLocaleString()}</p>
              <p>⏱️ {reservation.duration} minutes</p>
            </div>

            {reservation.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => confirmReservation(reservation.id)}
                  className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => cancelReservation(reservation.id)}
                  className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {reservations.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-xl">No reservations for today</p>
        </div>
      )}
    </div>
  );
};

export default ReservationPanel;
