import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const acceptedFormats = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

export const handleFileUpload = (files, setMessages, setFiles) => {
  const newFiles = Array.from(files).filter(file => {
    if (acceptedFormats.includes(file.type)) {
      setMessages(prevMessages => [
        ...prevMessages,
        { text: `Successfully uploaded ${file.name}.`, fromBot: true }
      ]);
      return true;
    } else {
      setMessages(prevMessages => [
        ...prevMessages,
        { text: `Failed to upload ${file.name}: Unsupported format`, fromBot: true }
      ]);
      return false;
    }
  });
  setFiles(prevFiles => [...prevFiles, ...newFiles]);
};

export const handleUserMessageSubmit = async (userMessage, setMessages, setUserMessage, files, setDocumentStructure) => {
  setMessages(prevMessages => [
    ...prevMessages,
    { text: userMessage, fromBot: false }
  ]);

  if (!files.length) {
    setMessages(prevMessages => [
      ...prevMessages,
      { text: 'Please upload a file to get started.', fromBot: true }
    ]);
  } else if (userMessage.trim().toLowerCase() === 'done') {
    setMessages(prevMessages => [
      ...prevMessages,
      { text: 'Processing files, please wait.', fromBot: true }
    ]);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      // const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      const response = {data: {
        "annexB": {
            "requirementSpecifications": {
                "introduction": {
                    "requirement": "The Authority has a requirement for the supply and delivery of [Enter number and type of devices]."
                },
                "purchaseRequirements": {
                    "firmPurchase": {
                        "description": "[Enter device specifications]",
                        "quantity": "[Enter quantity]"
                    },
                    "vendorOffer": "The Vendor shall ensure their best and final offer is equal or lower than the market rates including any applicable bulk discounts. The Vendor shall provide a detailed breakdown of their offer in their submission to the Authority. In the event that the quoted rate is lower than the market rate, the Authority reserves the right to apply the lower rate."
                },
                "warranty": {
                    "details": "In accordance to supplier provision. Onsite warranty of minimum 1 year and should cover labour, parts and material. In the event of any hardware part failure, supplier should be able to supply the replacement part without any need for exchange or question."
                },
                "pricingTable": {
                    "itemDescription": "[Enter device specifications]",
                    "quantity": "[Enter quantity]",
                    "totalPrice": "[Enter total price in S$]"
                },
                "evaluationCriteria": "The Authority shall evaluate the Vendor's proposal based on the meeting the technical requirements fully and the lowest price.",
                "securityRequirements": {
                    "deliveryPersonnel": "The successful Vendor is required to submit the particulars of the delivery personnel to the Authority upon request.",
                    "informationDisclosure": "Without permission from the Authority, the Vendor shall not disclose any project information to anyone else except those involved in the project and who have been security cleared by the Authority.",
                    "informationProtection": "The Vendor shall protect all purchase information with due care and diligence and report any loss or breach of information to the Authority without delay."
                },
                "delivery": {
                    "address": "Cintech II, 75 Science Park Dr, Singapore 118255",
                    "arrangementDetails": "Delivery date and time can be arranged with the Authority separately upon issuance of Purchase Order.",
                    "deliveryTimeframe": "The Contractor shall deliver within 3 weeks upon issuance of Purchase order."
                },
                "paymentTerms": {
                    "costBreakdown": "The Vendor is to provide detailed breakdown of costs for each component and indicate type and length of warranty.",
                    "contactForClarification": {
                        "name": "[Enter contact name]",
                        "phone": "[Enter phone number]",
                        "email": "[Enter email address]"
                    }
                }
            }
        }
    }}
      setDocumentStructure(response.data);
      setMessages(prevMessages => [
        ...prevMessages,
        { text: 'Analysis complete. Here is the document structure:', fromBot: true },
        { text: JSON.stringify(response.data, null, 2), fromBot: true },
        { text: 'Please provide content for each section of the document.', fromBot: true }
      ]);
    } catch (error) {
      setMessages(prevMessages => [
        ...prevMessages,
        { text: `Error processing files: ${error.message}`, fromBot: true }
      ]);
    }
  }
  setUserMessage('');
};

export const generateDocument = async (documentStructure, userInputs, originalFileType, setMessages) => {
  console.log('generateDocument function called');
  try {
    console.log('Sending request to backend');
    const response = await axios.post(`${API_BASE_URL}/generate`, {
      structure: documentStructure,
      userInputs,
      originalFileType
    }, {
      responseType: 'arraybuffer'
    });
    console.log('Received response from backend');

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'generated_document' + (originalFileType.includes('word') ? '.docx' : '.pdf'));
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    setMessages(prevMessages => [
      ...prevMessages,
      { text: 'Document generated successfully!', fromBot: true },
      { text: 'The document has been downloaded to your device.', fromBot: true }
    ]);
  } catch (error) {
    console.error('Error generating document:', error);
    setMessages(prevMessages => [
      ...prevMessages,
      { text: `Error generating document: ${error.message}`, fromBot: true }
    ]);
  }
};
