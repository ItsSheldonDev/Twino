// src/components/dashboard/ExpensesChart.js
import React from 'react';
import { Box, Text, VStack, HStack, Circle } from 'native-base';
import { VictoryPie, VictoryLegend } from 'victory-native';
import { Dimensions } from 'react-native';

const ExpensesChart = ({ data }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80; // Ajuster en fonction du padding
  
  // Générer des couleurs pour chaque catégorie 
  const COLORS = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
    "#FF9F40", "#8AC5FF", "#FEEA6C", "#75DDDD", "#B576F8"
  ];
  
  // Calculer le montant total
  const getTotalAmount = () => {
    return data.reduce((acc, item) => acc + item.amount, 0);
  };
  
  // Formatage des montants
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Préparer les données pour le graphique
  const chartData = data.map((item, index) => ({
    y: item.amount,
    x: item.category,
    label: `${Math.round((item.amount / getTotalAmount()) * 100)}%`,
    fill: COLORS[index % COLORS.length],
    color: COLORS[index % COLORS.length]
  }));
  
  // Préparer les données pour la légende
  const legendData = data.map((item, index) => ({
    name: `${item.category} (${formatCurrency(item.amount)})`,
    symbol: { fill: COLORS[index % COLORS.length] }
  }));
  
  return (
    <VStack>
      {/* Si aucune donnée disponible */}
      {data.length === 0 ? (
        <Box alignItems="center" justifyContent="center" h={200}>
          <Text color="gray.500">Aucune donnée disponible</Text>
        </Box>
      ) : (
        <VStack alignItems="center">
          {/* Graphique */}
          <Box alignItems="center" justifyContent="center">
            <VictoryPie
              data={chartData}
              width={chartWidth}
              height={200}
              colorScale={COLORS}
              innerRadius={40}
              labelRadius={70}
              style={{
                labels: {
                  fill: 'white',
                  fontSize: 10,
                  fontWeight: 'bold'
                }
              }}
              animate={{ duration: 500 }}
            />
          </Box>
          
          {/* Légende */}
          <Box mt={2}>
            {data.map((item, index) => (
              <HStack key={index} space={2} alignItems="center" mb={1}>
                <Circle size="3" bg={COLORS[index % COLORS.length]} />
                <Text fontSize="xs" fontWeight="medium">
                  {item.category}
                </Text>
                <Text fontSize="xs" ml="auto">
                  {formatCurrency(item.amount)} ({Math.round((item.amount / getTotalAmount()) * 100)}%)
                </Text>
              </HStack>
            ))}
          </Box>
        </VStack>
      )}
    </VStack>
  );
};

export default ExpensesChart;