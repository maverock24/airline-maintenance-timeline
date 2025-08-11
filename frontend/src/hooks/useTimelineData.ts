import { useEffect, useMemo, useState } from "react";
import { Flight, TimelineItem, WorkPackage } from "../utils/types";
import moment from "moment";
import { getStatusColor, getStatusSymbol } from "../utils/helpers";
import { API_ENDPOINTS } from '../utils/constants';

const useTimelineData = ({ showFlights, filteredRegistrations, filteredStatuses }: {
  showFlights: boolean;
  filteredRegistrations: string[];
  filteredStatuses: string[];
}) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [flightsRes, wpRes] = await Promise.all([
          fetch(API_ENDPOINTS.FLIGHTS),
          fetch(API_ENDPOINTS.WORK_PACKAGES),
        ]);

        if (!flightsRes.ok) throw new Error(`Failed to fetch flights: ${flightsRes.status}`);
        if (!wpRes.ok) throw new Error(`Failed to fetch work packages: ${wpRes.status}`);
        
        setFlights(await flightsRes.json());
        setWorkPackages(await wpRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { items, groups } = useMemo(() => {
    const uniqueRegistrations = new Set<string>();

    const filteredWorkPackages = workPackages.filter(wp => 
      (filteredRegistrations.length === 0 || filteredRegistrations.includes(wp.registration)) &&
      !filteredStatuses.includes(wp.status)
    );

    const filteredFlights = showFlights 
      ? flights.filter(f => filteredRegistrations.length === 0 || filteredRegistrations.includes(f.registration))
      : [];
    
    const flightItems: TimelineItem[] = filteredFlights.map(flight => {
      uniqueRegistrations.add(flight.registration);
      const depTime = moment(flight.schedDepTime).format('HH:mm');
      const arrTime = moment(flight.schedArrTime).format('HH:mm');
      return {
        id: `flight-${flight.flightId}`,
        group: flight.registration,
        title: `${flight.flightNum} | ${flight.schedDepStation} ${depTime} → ${flight.schedArrStation} ${arrTime}`,
        start_time: moment(flight.schedDepTime),
        end_time: moment(flight.schedArrTime),
        itemProps: { className: 'timeline-flight-item' },
      };
    });

    const wpItems: TimelineItem[] = filteredWorkPackages.map(wp => {
      uniqueRegistrations.add(wp.registration);
      const startTime = moment(wp.startDateTime).format('HH:mm');
      const endTime = moment(wp.endDateTime).format('HH:mm');
      return {
        id: `wp-${wp.workPackageId}`,
        group: wp.registration,
        title: `${getStatusSymbol(wp.status)} ${wp.name} | ${wp.workOrders} WOs | ${wp.status} | ${startTime}-${endTime}`,
        start_time: moment(wp.startDateTime),
        end_time: moment(wp.endDateTime),
        itemProps: { style: { background: getStatusColor(wp.status), border: `2px solid ${getStatusColor(wp.status)}`, color: 'white' }, className: 'timeline-workpackage-item' },
      };
    });

    return {
      items: [...flightItems, ...wpItems],
      groups: Array.from(uniqueRegistrations).sort().map(reg => ({ id: reg, title: reg })),
    };
  }, [flights, workPackages, showFlights, filteredRegistrations, filteredStatuses]);

  const allRegistrations = useMemo(() => Array.from(new Set([...flights.map(f => f.registration), ...workPackages.map(wp => wp.registration)])).sort(), [flights, workPackages]);
  
  const allStatuses = useMemo(() => {
    if (filteredRegistrations.length === 0) {
      return Array.from(new Set(workPackages.map(wp => wp.status))).sort();
    }
    
    const statusesForSelectedAircraft = workPackages
      .filter(wp => filteredRegistrations.includes(wp.registration))
      .map(wp => wp.status);
    
    return Array.from(new Set(statusesForSelectedAircraft)).sort();
  }, [workPackages, filteredRegistrations]);

  return { loading, error, items, groups, allRegistrations, allStatuses, workPackages, flights };
};

export default useTimelineData;