class ScheduleManager {
    constructor() {
        this.currentDate = new Date();
        this.scheduleData = {
            truck1: {
                maintenanceDay: 2, // Martes
                name: 'Camión 1',
                primaryDriver: 1
            },
            truck2: {
                maintenanceDay: 4, // Jueves
                name: 'Camión 2',
                primaryDriver: 2
            },
            drivers: [
                { id: 1, name: 'Chofer 1', consecutiveWorkDays: 0, lastWorkedDay: null, nextRestDay: null },
                { id: 2, name: 'Chofer 2', consecutiveWorkDays: 0, lastWorkedDay: null, nextRestDay: null },
                { id: 3, name: 'Chofer 3', consecutiveWorkDays: 0, lastWorkedDay: null, nextRestDay: null }
            ]
        };
        
        this.initializeEventListeners();
        this.updateScheduleDisplay();
    }

    initializeEventListeners() {
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
            this.updateScheduleDisplay();
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
            this.updateScheduleDisplay();
        });
    }

    getWeekDates() {
        const dates = [];
        const currentDay = this.currentDate.getDay();
        const diff = this.currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const monday = new Date(this.currentDate.setDate(diff));

        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            dates.push(day);
        }
        return dates;
    }

    isMaintenanceDay(truck, dayOfWeek) {
        return truck.maintenanceDay === dayOfWeek;
    }

    shouldRest(driver, date) {
        if (!driver.lastWorkedDay) return false;
        
        if (driver.nextRestDay) {
            return date.getTime() === driver.nextRestDay.getTime();
        }
        
        return driver.consecutiveWorkDays >= 2;
    }

    assignDrivers(weekDates) {
        const schedule = {
            truck1: Array(7).fill(null),
            truck2: Array(7).fill(null),
            drivers: this.scheduleData.drivers.map(() => Array(7).fill('rest'))
        };

        // Reset drivers' schedule for the new week
        this.scheduleData.drivers.forEach(driver => {
            driver.consecutiveWorkDays = 0;
            driver.lastWorkedDay = null;
            driver.nextRestDay = null;
        });

        weekDates.forEach((date, dayIndex) => {
            const dayOfWeek = date.getDay() || 7;
            const driver1 = this.scheduleData.drivers[0];
            const driver2 = this.scheduleData.drivers[1];
            const driver3 = this.scheduleData.drivers[2];

            // Manejar Camión 1
            if (!this.isMaintenanceDay(this.scheduleData.truck1, dayOfWeek)) {
                if (!this.shouldRest(driver1, date)) {
                    // Asignar Chofer 1
                    schedule.truck1[dayIndex] = 1;
                    schedule.drivers[0][dayIndex] = 'work';
                    driver1.consecutiveWorkDays++;
                    driver1.lastWorkedDay = date;
                    if (driver1.consecutiveWorkDays === 2) {
                        const nextDay = new Date(date);
                        nextDay.setDate(date.getDate() + 1);
                        driver1.nextRestDay = nextDay;
                    }
                } else if (!this.shouldRest(driver3, date)) {
                    // Asignar Chofer 3 cuando Chofer 1 descansa
                    schedule.truck1[dayIndex] = 3;
                    schedule.drivers[2][dayIndex] = 'work';
                    driver3.consecutiveWorkDays++;
                    driver3.lastWorkedDay = date;
                    if (driver3.consecutiveWorkDays === 2) {
                        const nextDay = new Date(date);
                        nextDay.setDate(date.getDate() + 1);
                        driver3.nextRestDay = nextDay;
                    }
                }
            }

            // Manejar Camión 2
            if (!this.isMaintenanceDay(this.scheduleData.truck2, dayOfWeek)) {
                if (!this.shouldRest(driver2, date)) {
                    // Asignar Chofer 2
                    schedule.truck2[dayIndex] = 2;
                    schedule.drivers[1][dayIndex] = 'work';
                    driver2.consecutiveWorkDays++;
                    driver2.lastWorkedDay = date;
                    if (driver2.consecutiveWorkDays === 2) {
                        const nextDay = new Date(date);
                        nextDay.setDate(date.getDate() + 1);
                        driver2.nextRestDay = nextDay;
                    }
                } else if (!this.shouldRest(driver3, date) && schedule.drivers[2][dayIndex] !== 'work') {
                    // Asignar Chofer 3 cuando Chofer 2 descansa y Chofer 3 no está ya trabajando
                    schedule.truck2[dayIndex] = 3;
                    schedule.drivers[2][dayIndex] = 'work';
                    driver3.consecutiveWorkDays++;
                    driver3.lastWorkedDay = date;
                    if (driver3.consecutiveWorkDays === 2) {
                        const nextDay = new Date(date);
                        nextDay.setDate(date.getDate() + 1);
                        driver3.nextRestDay = nextDay;
                    }
                }
            }

            // Reset consecutiveWorkDays después de descanso
            [driver1, driver2, driver3].forEach(driver => {
                if (this.shouldRest(driver, date)) {
                    driver.consecutiveWorkDays = 0;
                    driver.nextRestDay = null;
                }
            });
        });

        return schedule;
    }

    updateScheduleDisplay() {
        const weekDates = this.getWeekDates();
        const schedule = this.assignDrivers(weekDates);
        
        // Update week display
        const firstDay = weekDates[0].toLocaleDateString();
        const lastDay = weekDates[6].toLocaleDateString();
        document.getElementById('currentWeek').textContent = `${firstDay} - ${lastDay}`;

        // Update truck rows
        const truck1Row = document.getElementById('truck1Row');
        const truck2Row = document.getElementById('truck2Row');
        
        truck1Row.innerHTML = '<td>Camión 1</td>';
        truck2Row.innerHTML = '<td>Camión 2</td>';

        weekDates.forEach((date, index) => {
            const dayOfWeek = date.getDay() || 7;
            
            // Truck 1
            const truck1Cell = document.createElement('td');
            if (this.isMaintenanceDay(this.scheduleData.truck1, dayOfWeek)) {
                truck1Cell.className = 'maintenance';
                truck1Cell.textContent = 'Mantenimiento';
            } else {
                const driverId = schedule.truck1[index];
                truck1Cell.textContent = driverId ? `Chofer ${driverId}` : 'No asignado';
                if (driverId === 3) {
                    truck1Cell.style.backgroundColor = '#FFE4B5';
                }
            }
            truck1Row.appendChild(truck1Cell);

            // Truck 2
            const truck2Cell = document.createElement('td');
            if (this.isMaintenanceDay(this.scheduleData.truck2, dayOfWeek)) {
                truck2Cell.className = 'maintenance';
                truck2Cell.textContent = 'Mantenimiento';
            } else {
                const driverId = schedule.truck2[index];
                truck2Cell.textContent = driverId ? `Chofer ${driverId}` : 'No asignado';
                if (driverId === 3) {
                    truck2Cell.style.backgroundColor = '#FFE4B5';
                }
            }
            truck2Row.appendChild(truck2Cell);
        });

        // Update driver rows
        schedule.drivers.forEach((driverSchedule, driverIndex) => {
            const driverRow = document.getElementById(`driver${driverIndex + 1}Row`);
            driverRow.innerHTML = `<td>Chofer ${driverIndex + 1}</td>`;
            
            driverSchedule.forEach(status => {
                const cell = document.createElement('td');
                cell.className = status === 'work' ? 'working' : 'resting';
                cell.textContent = status === 'work' ? 'Trabajando' : 'Descanso';
                driverRow.appendChild(cell);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ScheduleManager();
});