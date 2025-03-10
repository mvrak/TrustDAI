import { useState, useEffect } from "react";
import {
  connectWallet,
  disconnectWallet,
  setupAccountChangeListener,
  addProfile,
  fetchUserFileIds,
  getFileData,
  grantAccess,
  getAccessList,
  revokeAccess,
} from "../services/helpers.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wallet, Power, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { z } from "zod";
import { DataCard } from "@/components/DataCard"; // Adjust path as needed

// Define profile types based on interfaces with descriptions
const profileTypes = {
  basicDetails: {
    fields: [
      { name: "firstName", label: "First Name", type: "text", placeholder: "John" },
      { name: "lastName", label: "Last Name", type: "text", placeholder: "Doe" },
      { name: "email", label: "Email", type: "email", placeholder: "john@example.com" },
      { name: "phone", label: "Phone", type: "text", placeholder: "+1234567890" },
      { name: "dateOfBirth", label: "Date of Birth", type: "date", placeholder: "YYYY-MM-DD" },
    ],
    schema: z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email"),
      phone: z.string().min(1, "Phone is required"),
      dateOfBirth: z.string().min(1, "Date of birth is required"),
    }),
    description: "Store your basic personal information",
  },
  address: {
    fields: [
      { name: "street", label: "Street", type: "text", placeholder: "123 Main St" },
      { name: "city", label: "City", type: "text", placeholder: "New York" },
      { name: "state", label: "State", type: "text", placeholder: "NY" },
      { name: "postalCode", label: "Postal Code", type: "text", placeholder: "10001" },
      { name: "country", label: "Country", type: "text", placeholder: "USA" },
    ],
    schema: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      postalCode: z.string().min(1, "Postal code is required"),
      country: z.string().min(1, "Country is required"),
    }),
    description: "Save your address details",
  },
  travelData: {
    fields: [
      { name: "passportNumber", label: "Passport Number", type: "text", placeholder: "X12345678" },
      { name: "expiryDate", label: "Expiry Date", type: "date", placeholder: "YYYY-MM-DD" },
      { name: "visaDetails", label: "Visa Details", type: "text", placeholder: "Visa info" },
      { name: "preferredAirlines", label: "Preferred Airlines", type: "text", placeholder: "Delta, United" },
    ],
    schema: z.object({
      passportNumber: z.string().min(1, "Passport number is required"),
      expiryDate: z.string().min(1, "Expiry date is required"),
      visaDetails: z.string().min(1, "Visa details required"),
      preferredAirlines: z.string().min(1, "Preferred airlines required"),
    }),
    description: "Manage your travel information",
  },
  blockchainWallet: {
    fields: [
      { name: "walletName", label: "Wallet Name", type: "text", placeholder: "Main Wallet" },
      { name: "walletAddress", label: "Wallet Address", type: "text", placeholder: "0x..." },
      { name: "blockchain", label: "Blockchain", type: "text", placeholder: "Ethereum" },
      { name: "notes", label: "Notes", type: "text", placeholder: "Additional info" },
    ],
    schema: z.object({
      walletName: z.string().min(1, "Wallet name is required"),
      walletAddress: z.string().min(1, "Wallet address is required"),
      blockchain: z.string().min(1, "Blockchain is required"),
      notes: z.string().min(1, "Notes required"),
    }),
    description: "Track your blockchain wallets",
  },
  socialProfile: {
    fields: [
      { name: "platform", label: "Platform", type: "text", placeholder: "Twitter" },
      { name: "username", label: "Username", type: "text", placeholder: "@johndoe" },
      { name: "url", label: "URL", type: "text", placeholder: "https://twitter.com/johndoe" },
    ],
    schema: z.object({
      platform: z.string().min(1, "Platform is required"),
      username: z.string().min(1, "Username is required"),
      url: z.string().url("Invalid URL"),
    }),
    description: "Add your social media profiles",
  },
  employmentHistory: {
    fields: [
      { name: "company", label: "Company", type: "text", placeholder: "Tech Corp" },
      { name: "position", label: "Position", type: "text", placeholder: "Developer" },
      { name: "startDate", label: "Start Date", type: "date", placeholder: "YYYY-MM-DD" },
      { name: "endDate", label: "End Date", type: "date", placeholder: "YYYY-MM-DD" },
      { name: "description", label: "Description", type: "text", placeholder: "Job duties" },
    ],
    schema: z.object({
      company: z.string().min(1, "Company is required"),
      position: z.string().min(1, "Position is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      description: z.string().min(1, "Description is required"),
    }),
    description: "Record your work experience",
  },
  educationDetails: {
    fields: [
      { name: "institution", label: "Institution", type: "text", placeholder: "University" },
      { name: "degree", label: "Degree", type: "text", placeholder: "BSc" },
      { name: "field", label: "Field", type: "text", placeholder: "Computer Science" },
      { name: "startDate", label: "Start Date", type: "date", placeholder: "YYYY-MM-DD" },
      { name: "endDate", label: "End Date", type: "date", placeholder: "YYYY-MM-DD" },
      { name: "grade", label: "Grade", type: "text", placeholder: "3.8 GPA" },
    ],
    schema: z.object({
      institution: z.string().min(1, "Institution is required"),
      degree: z.string().min(1, "Degree is required"),
      field: z.string().min(1, "Field is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      grade: z.string().min(1, "Grade is required"),
    }),
    description: "Document your education history",
  },
};

type ProfileType = keyof typeof profileTypes;

const Index = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ProfileType>("basicDetails");
  const [newProfile, setNewProfile] = useState<Record<string, string>>({});
  const [userFilesIds, setUserFilesIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // State for managing access modal
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedAccessType, setSelectedAccessType] = useState<ProfileType | null>(null);
  const [accessList, setAccessList] = useState<Record<ProfileType, string[]>>({});
  const [newAccess, setNewAccess] = useState("");

  // Initialize accessList for each profile type on mount when account is available
  useEffect(() => {
    if (!account) return;
    const initialAccess: Record<ProfileType, string[]> = {} as Record<ProfileType, string[]>;
    (Object.keys(profileTypes) as ProfileType[]).forEach(async (type) => {
      const addresses = await getAccessList(account, type);
      initialAccess[type] = addresses;
    });
    setAccessList(initialAccess);
  }, [account]);

  useEffect(() => {
    // Reset the form fields when the selected profile type changes
    const initialFields = profileTypes[selectedType].fields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {} as Record<string, string>);
    setNewProfile(initialFields);
  }, [selectedType]);

  // Wallet Connection Handlers
  const handleConnect = async () => {
    try {
      const account = await connectWallet();
      setAccount(account);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.slice(0, 6)}...${account.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setAccount(null);
      setUserFilesIds([]);
      toast({ title: "Wallet Disconnected" });
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!account) return;
    const cleanup = setupAccountChangeListener((accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        toast({
          title: "Account Changed",
          description: `Switched to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      } else {
        handleDisconnect();
      }
    });
    return cleanup;
  }, [account]);

  useEffect(() => {
    if (account) {
      handleFetchUserFileIds();
    }
  }, [account]);

  const handleFetchUserFileIds = async () => {
    if (!isLoading) {
      setIsLoading(true);
      try {
        const userFiles = await fetchUserFileIds();
        setUserFilesIds(userFiles);
      } catch (error) {
        console.error("Fetch failed", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelect = async (type: ProfileType) => {
    // Update the selected profile type
    setSelectedType(type);
    try {
      const stringData = await getFileData(account, type);
      if (stringData) {
        const parsedData = profileTypes[type].schema.parse(JSON.parse(stringData));
        // Populate the form with the loaded data
        setNewProfile(parsedData);
      } else {
        // If no data found, reset form fields for the type
        const emptyFields = profileTypes[type].fields.reduce((acc, field) => {
          acc[field.name] = "";
          return acc;
        }, {} as Record<string, string>);
        setNewProfile(emptyFields);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  };

  const handleAddProfile = async () => {
    try {
      const schema = profileTypes[selectedType].schema;
      const validatedProfile = schema.parse(newProfile);
      if (!account) throw new Error("No account connected");
      setIsAdding(true);
      const fileID = await addProfile(
        account,
        selectedType,
        JSON.stringify(validatedProfile)
      );
      toast({ title: "Profile Added", description: "" });
      setNewProfile(
        profileTypes[selectedType].fields.reduce((acc, field) => {
          acc[field.name] = "";
          return acc;
        }, {} as Record<string, string>)
      );
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 4001 || error.message.includes("user rejected")) {
        errorMessage = "You rejected the transaction.";
      }
      toast({
        title: "Failed to Add Profile",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isFormValid = () => {
    return profileTypes[selectedType].fields.every(
      (field) => newProfile[field.name]
    );
  };

  // Handlers for managing access in the modal
  const handleAddAccess = async () => {
    if (!selectedAccessType) return;
    if (newAccess.trim() === "") return;
    try {
      const tx = await grantAccess(account, selectedAccessType, newAccess);
      console.log(tx);
    } catch (error) {
      console.error("Error granting access:", error);
    }
    setAccessList((prev) => ({
      ...prev,
      [selectedAccessType]: [...(prev[selectedAccessType] || []), newAccess.trim()],
    }));
    setNewAccess("");
  };

  const handleRemoveAccess = async (address: string) => {
    if (!selectedAccessType) return;
    try {
      const tx = await revokeAccess(account, selectedAccessType, address);
      console.log(tx);
    } catch (error) {
      console.error("Error revoking access:", error);
    }
    setAccessList((prev) => ({
      ...prev,
      [selectedAccessType]: prev[selectedAccessType].filter(
        (item) => item !== address
      ),
    }));
  };

  return (
    // Outer container with max-width, centering, background, and dark mode support
    <div className="w-full max-w-screen-lg mx-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        {account && (
          <p className="text-sm text-muted-foreground font-mono dark:text-gray-300">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={toggleTheme} className="glass">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {!account ? (
            <Button variant="outline" onClick={handleConnect} className="glass">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <Button variant="outline" onClick={handleDisconnect} className="glass">
              <Power className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {account && (
        <>
          <Card className="glass animate-fadeIn animation-delay-200 w-full bg-white dark:bg-gray-800 dark:shadow-md rounded-md">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Your Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.entries(profileTypes) as [ProfileType, typeof profileTypes[ProfileType]][]).map(
                    ([type, { description }]) => (
                      <div key={type} className="flex flex-col gap-2">
                        <DataCard
                          title={type
                            .split(/(?=[A-Z])/)
                            .join(" ")
                            .replace(/^\w/, (c) => c.toUpperCase())}
                          description={description}
                          onSelect={() => handleSelect(type)}
                          isSelected={selectedType === type}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass w-full"
                          onClick={() => {
                            setSelectedAccessType(type);
                            setIsAccessModalOpen(true);
                          }}
                        >
                          Manage Access
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-md font-medium dark:text-gray-200">
                  {selectedType
                    .split(/(?=[A-Z])/)
                    .join(" ")
                    .replace(/^\w/, (c) => c.toUpperCase())}{" "}
                  Fields
                </h3>
                {profileTypes[selectedType].fields.map((field) => (
                  <div key={field.name}>
                    <label className="text-sm font-medium mb-2 block dark:text-gray-300">
                      {field.label}
                    </label>
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={newProfile[field.name] || ""}
                      onChange={(e) =>
                        setNewProfile({
                          ...newProfile,
                          [field.name]: e.target.value,
                        })
                      }
                      className="glass"
                      disabled={isAdding}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleAddProfile}
                disabled={isAdding || !isFormValid()}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Profile"
                )}
              </Button>
            </CardFooter>
            <CardFooter>
              <Card className="glass animate-fadeIn w-full bg-white dark:bg-gray-800 dark:shadow-md rounded-md">
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : userFilesIds.length === 0 ? (
                    <p className="text-muted-foreground dark:text-gray-300">No profiles found.</p>
                  ) : (
                    userFilesIds.map((fileID, i) => (
                      <div key={i} className="border-b pb-2">
                        <p className="paragraph dark:text-gray-200">
                          <strong>FileID:</strong> {fileID}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </CardFooter>
          </Card>
        </>
      )}

      {/* Modal for managing access */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setIsAccessModalOpen(false)}
          ></div>
          {/* Modal Content */}
          <Card className="z-10 glass max-w-md w-full bg-white dark:bg-gray-800 dark:shadow-md rounded-md">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">
                Manage Access -{" "}
                {selectedAccessType &&
                  selectedAccessType
                    .split(/(?=[A-Z])/)
                    .join(" ")
                    .replace(/^\w/, (c) => c.toUpperCase())}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAccessType &&
              accessList[selectedAccessType] &&
              accessList[selectedAccessType].length > 0 ? (
                accessList[selectedAccessType].map((address, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <span className="text-xs text-muted-foreground font-mono dark:text-gray-300">
                      {address}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAccess(address)}
                    >
                      Delete
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground dark:text-gray-300">No access granted yet.</p>
              )}
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter address"
                  value={newAccess}
                  onChange={(e) => setNewAccess(e.target.value)}
                  className="glass"
                />
                <Button variant="outline" onClick={handleAddAccess} className="glass">
                  Add
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={() => setIsAccessModalOpen(false)} className="glass">
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
