export interface DiscoveredDevice {
  ip: string;
  mac: string;
  hostname: string;
  deviceType: 'ROUTER' | 'SERVER' | 'IOT_DEVICE' | 'SMART_TV' | 'MOBILE' | 'UNKNOWN';
  pingMs: number;
  openPorts: number[];
  status: 'ONLINE' | 'STANDBY' | 'BLOCKED';
}

export interface NetworkDiagnostic {
  ssid: string;
  gatewayIp: string;
  publicIp: string;
  dnsServer: string;
  downloadMbps: number;
  uploadMbps: number;
  jitterMs: number;
  packetLossPercent: number;
  securityProtocol: string;
  devices: DiscoveredDevice[];
}

export class NetworkService {
  public static async scanLocalNetwork(): Promise<NetworkDiagnostic> {
    await new Promise((r) => setTimeout(r, 900));

    const simulatedDevices: DiscoveredDevice[] = [
      {
        ip: '192.168.1.1',
        mac: '00:1A:2B:3C:4D:5E',
        hostname: 'Stark-Gateway-Quantum-AXE',
        deviceType: 'ROUTER',
        pingMs: 1.2,
        openPorts: [80, 443, 8080, 22],
        status: 'ONLINE',
      },
      {
        ip: '192.168.1.42',
        mac: 'AC:DE:48:00:11:22',
        hostname: 'Jarvis-Core-Neural-Node',
        deviceType: 'SERVER',
        pingMs: 0.8,
        openPorts: [3000, 8000, 9090, 5432],
        status: 'ONLINE',
      },
      {
        ip: '192.168.1.105',
        mac: '70:EE:50:AA:BB:CC',
        hostname: 'Smart-Display-HUD-OLED',
        deviceType: 'SMART_TV',
        pingMs: 8.4,
        openPorts: [8008, 8009],
        status: 'ONLINE',
      },
      {
        ip: '192.168.1.118',
        mac: '9C:20:7B:12:34:56',
        hostname: 'IoT-Thermal-Sensor-Bay7',
        deviceType: 'IOT_DEVICE',
        pingMs: 14.1,
        openPorts: [1883],
        status: 'ONLINE',
      },
      {
        ip: '192.168.1.240',
        mac: 'F4:F5:D8:99:88:77',
        hostname: 'Operator-Mobile-Terminal',
        deviceType: 'MOBILE',
        pingMs: 3.5,
        openPorts: [8081],
        status: 'ONLINE',
      },
    ];

    return {
      ssid: 'Stark-Secure-Mesh-5G',
      gatewayIp: '192.168.1.1',
      publicIp: '198.51.100.42',
      dnsServer: '1.1.1.1 (Cloudflare Quantum)',
      downloadMbps: parseFloat((340 + Math.random() * 80).toFixed(1)),
      uploadMbps: parseFloat((85 + Math.random() * 20).toFixed(1)),
      jitterMs: 1.8,
      packetLossPercent: 0.0,
      securityProtocol: 'WPA3 Enterprise (256-Bit Encrypted)',
      devices: simulatedDevices,
    };
  }
}
