import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { EmergencyMarker } from '@/constants/emergency';
import { Colors } from '@/constants/theme';

interface ActiveEmergencyItemProps {
  marker: EmergencyMarker;
  emergencyType: any;
  isSelected: boolean;
  onPress: () => void;
  onRemove: () => void;
  canRemove?: boolean; // Whether this user can remove this marker
}

export const ActiveEmergencyItem = ({ 
  marker, 
  emergencyType, 
  isSelected,
  onPress, 
  onRemove,
  canRemove = true
}: ActiveEmergencyItemProps) => {
  
  const handlePress = () => {
    console.log("ActiveEmergencyItem pressed:", marker.id);
    onPress();
  };
  
  const handleRemove = (e?: any) => {
    console.log("Remove button pressed:", marker.id);
    e?.stopPropagation?.();
    onRemove();
  };
  
  const getTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        { borderLeftColor: emergencyType?.color }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: `${emergencyType?.color}20` }
        ]}>
          <Text style={styles.icon}>{emergencyType?.icon}</Text>
        </View>
        
        <View style={styles.info}>
          <Text style={styles.label}>{emergencyType?.label}</Text>
          <View style={styles.metadata}>
            <MaterialIcons name="access-time" size={12} color="#999" />
            <Text style={styles.time}>{getTimeAgo(marker.timestamp)}</Text>
          </View>
        </View>
      </View>

      {canRemove && (
        <TouchableOpacity 
          onPress={handleRemove}
          style={[styles.removeButton, { backgroundColor: emergencyType?.color }]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedContainer: {
    backgroundColor: '#fff',
    borderColor: Colors.light.tint,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  distance: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
