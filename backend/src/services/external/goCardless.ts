import axios from 'axios';
import Config from '../../config';

interface Token {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
}

interface Institution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
  max_access_valid_for_days: string;
}

interface EndUserAgreement {
  id: string;
  created: string;
  max_historical_days: number;
  access_valid_for_days: number;
  access_scope: string[];
  accepted: string;
  institution_id: string;
}

interface RequisitionResponse {
  id: string;
  redirect: string;
  status: {
    short: string;
    long: string;
    description: string;
  };
  agreement: string;
  accounts: string[];
  reference: string;
  user_language: string;
  link: string;
}

export class GoCardlessService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;
  
  private async getAccessToken(): Promise<string> {

    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    
    try {
      const response = await axios.post<Token>(`${Config.GOCARDLESS.BASE_URL}/token/new/`, {
        secret_id: Config.GOCARDLESS.SECRET_ID,
        secret_key: Config.GOCARDLESS.SECRET_KEY
      });
      
      this.accessToken = response.data.access;
      this.refreshToken = response.data.refresh;
      

      const expirySeconds = response.data.access_expires - 300;
      this.tokenExpiry = new Date(Date.now() + expirySeconds * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Erreur lors de la récupération du token GoCardless:', error);
      throw new Error('Impossible de se connecter à GoCardless');
    }
  }
  
  async getInstitutions(country: string = 'fr'): Promise<Institution[]> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get<Institution[]>(
        `${Config.GOCARDLESS.BASE_URL}/institutions/?country=${country}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des institutions:', error);
      throw new Error('Impossible de récupérer la liste des banques');
    }
  }
  
  async createEndUserAgreement(
    institutionId: string,
    maxHistoricalDays: number = 180,
    accessValidForDays: number = 90,
    accessScope: string[] = ['balances', 'details', 'transactions']
  ): Promise<EndUserAgreement> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.post<EndUserAgreement>(
        `${Config.GOCARDLESS.BASE_URL}/agreements/enduser/`,
        {
          institution_id: institutionId,
          max_historical_days: maxHistoricalDays.toString(),
          access_valid_for_days: accessValidForDays.toString(),
          access_scope: accessScope
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'accord utilisateur:', error);
      throw new Error('Impossible de créer l\'accord d\'accès bancaire');
    }
  }
  
  async createRequisition(
    institutionId: string,
    redirectUrl: string,
    reference: string = '',
    agreementId: string | null = null,
    userLanguage: string = 'FR'
  ): Promise<RequisitionResponse> {
    const token = await this.getAccessToken();
    
    try {
      const payload: any = {
        redirect: redirectUrl,
        institution_id: institutionId,
        reference: reference,
        user_language: userLanguage
      };
      
      if (agreementId) {
        payload.agreement = agreementId;
      }
      
      const response = await axios.post<RequisitionResponse>(
        `${Config.GOCARDLESS.BASE_URL}/requisitions/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la réquisition:', error);
      throw new Error('Impossible de créer la connexion bancaire');
    }
  }
  
  async getRequisition(requisitionId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `${Config.GOCARDLESS.BASE_URL}/requisitions/${requisitionId}/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la réquisition:', error);
      throw new Error('Impossible de récupérer les informations de connexion bancaire');
    }
  }
  
  async getAccountTransactions(accountId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `${Config.GOCARDLESS.BASE_URL}/accounts/${accountId}/transactions/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      throw new Error('Impossible de récupérer les transactions du compte');
    }
  }
  
  async getAccountBalances(accountId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `${Config.GOCARDLESS.BASE_URL}/accounts/${accountId}/balances/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des soldes:', error);
      throw new Error('Impossible de récupérer le solde du compte');
    }
  }
  
  async getAccountDetails(accountId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios.get(
        `${Config.GOCARDLESS.BASE_URL}/accounts/${accountId}/details/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du compte:', error);
      throw new Error('Impossible de récupérer les détails du compte');
    }
  }
}

export default new GoCardlessService();